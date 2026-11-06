import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Componente } from '../componentes/componente.entity';
import { Tienda } from './entidades/tienda.entity';
import { Oferta } from './entidades/oferta.entity';
import { FuenteExterna, ResultadoTienda } from './fuentes/tipos';
import { WooCommerceFuente } from './fuentes/woocommerce.fuente';
import { AliExpressFuente } from './fuentes/aliexpress.fuente';
import { MercadoLibreFuente } from './fuentes/mercadolibre.fuente';
import { coincide, consultaPorDefecto } from './fuentes/emparejador';
import { diaLocal } from './fechas';

const ESPERA_MS = Number(process.env.PRECIOS_ESPERA_MS ?? 400); // pausa entre consultas a una misma tienda
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface ResumenSincronizacion {
  tiendas: { tienda: string; consultas: number; ofertas: number; error?: string }[];
  ofertas: number;
  duracionSegundos: number;
}

// Consulta las tiendas reales, empareja sus productos con el catálogo y guarda
// la mejor oferta de cada tienda para cada componente, más un punto de historial por día.
@Injectable()
export class SincronizadorService {
  private readonly log = new Logger('Sincronizador');
  private readonly fuentes: Record<string, FuenteExterna>;

  constructor(
    @InjectRepository(Tienda) private readonly tiendas: Repository<Tienda>,
    @InjectRepository(Oferta) private readonly ofertas: Repository<Oferta>,
    @InjectRepository(Componente) private readonly componentes: Repository<Componente>,
    private readonly db: DataSource,
    woocommerce: WooCommerceFuente,
    aliexpress: AliExpressFuente,
    mercadolibre: MercadoLibreFuente,
  ) {
    this.fuentes = { woocommerce, aliexpress, mercadolibre };
  }

  // Qué tiendas reales se pueden consultar ahora mismo
  async tiendasDisponibles(): Promise<Tienda[]> {
    const lista = await this.tiendas.find({ where: { activa: true } });
    return lista.filter((t) => this.fuentes[t.fuente]?.disponible());
  }

  async sincronizar(soloComponentes?: number[]): Promise<ResumenSincronizacion> {
    const inicio = Date.now();
    const tiendas = await this.tiendasDisponibles();
    const componentes = await this.componentes.find(soloComponentes ? { where: { id: In(soloComponentes) } } : {});

    // Cada tienda se recorre por separado y en paralelo con las demás
    const resumenes = await Promise.all(tiendas.map((t) => this.sincronizarTienda(t, componentes)));
    await this.actualizarImagenes(componentes.map((c) => c.id));

    const total = resumenes.reduce((s, r) => s + r.ofertas, 0);
    this.log.log(`Sincronización: ${total} ofertas reales de ${tiendas.length} tienda(s) en ${((Date.now() - inicio) / 1000).toFixed(0)} s`);
    return { tiendas: resumenes, ofertas: total, duracionSegundos: Math.round((Date.now() - inicio) / 1000) };
  }

  private async sincronizarTienda(tienda: Tienda, componentes: Componente[]) {
    const fuente = this.fuentes[tienda.fuente];
    const cache = new Map<string, ResultadoTienda[]>();
    let consultas = 0;
    let encontradas = 0;
    try {
      for (const c of componentes) {
        const consulta = c.busqueda || consultaPorDefecto(`${c.nombre}`);
        if (!cache.has(consulta)) {
          cache.set(consulta, await fuente.buscar(tienda, consulta));
          consultas++;
          await esperar(ESPERA_MS);
        }
        const candidatos = cache
          .get(consulta)
          .filter((r) => coincide({ nombre: c.nombre, marca: c.marca, categoria: c.categoria.codigo, precioReferencia: c.precio }, r.titulo, r.precio));

        // Se queda con la opción más barata con stock (o la más barata si ninguna tiene)
        candidatos.sort((a, b) => Number(b.enStock) - Number(a.enStock) || a.precio - b.precio);
        const elegido = candidatos[0];
        if (elegido) {
          await this.guardarOferta(tienda, c, elegido);
          encontradas++;
        } else {
          // Ya no lo vende: se quita la oferta (el historial anterior se conserva en otras ofertas)
          await this.ofertas.delete({ tienda: { id: tienda.id }, componente: { id: c.id } });
        }
      }
      await this.tiendas.update(tienda.id, { ultimaSincronizacion: new Date(), ultimoError: null });
      return { tienda: tienda.nombre, consultas, ofertas: encontradas };
    } catch (e) {
      this.log.warn(`${tienda.nombre}: ${e.message}`);
      await this.tiendas.update(tienda.id, { ultimoError: String(e.message).slice(0, 250) });
      return { tienda: tienda.nombre, consultas, ofertas: encontradas, error: e.message };
    }
  }

  private async guardarOferta(tienda: Tienda, c: Componente, r: ResultadoTienda) {
    let oferta = await this.ofertas.findOne({ where: { tienda: { id: tienda.id }, componente: { id: c.id } } });
    const datos = {
      precio: r.precio,
      enStock: r.enStock,
      url: r.url,
      tituloTienda: r.titulo.slice(0, 250),
      imagenUrl: r.imagen,
      idExterno: r.idExterno,
      actualizado: new Date(),
    };
    if (oferta) await this.ofertas.update(oferta.id, datos);
    else oferta = await this.ofertas.save(this.ofertas.create({ ...datos, tienda, componente: { id: c.id } }));

    await this.db.query(
      `INSERT INTO historial_precios (ofertaId, fecha, precio) VALUES (?, ?, ?)
       ON CONFLICT(ofertaId, fecha) DO UPDATE SET precio = excluded.precio`,
      [oferta.id, diaLocal(), r.precio],
    );
  }

  // Usa la foto de la tienda como imagen del producto (es la foto exacta del modelo)
  private async actualizarImagenes(ids: number[]) {
    if (!ids.length) return;
    const filas: { cid: number; imagen: string; tienda: string }[] = await this.db.query(
      `SELECT o.componenteId AS cid, o.imagenUrl AS imagen, t.nombre AS tienda
         FROM ofertas o JOIN tiendas t ON t.id = o.tiendaId
        WHERE o.imagenUrl IS NOT NULL AND t.fuente != 'simulada' AND o.componenteId IN (${ids.map(() => '?').join(',')})
        ORDER BY o.enStock DESC, o.precio ASC`,
      ids,
    );
    const vistos = new Set<number>();
    for (const f of filas) {
      if (vistos.has(f.cid)) continue;
      vistos.add(f.cid);
      await this.componentes.update(f.cid, { imagenTienda: f.imagen, imagenTiendaOrigen: f.tienda });
    }
  }
}
