import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Oferta } from './entidades/oferta.entity';
import { Tienda } from './entidades/tienda.entity';
import { diaLocal, sumarDias } from './fechas';
import { Componente } from '../componentes/componente.entity';

export interface ResumenPrecio {
  mejor: number | null; // mejor precio con stock (o el mejor sin stock si ninguna tiene)
  tienda: { id: number; nombre: string; color: string } | null;
  ofertas: number; // tiendas que lo venden
  conStock: number;
  hayStock: boolean;
}

export interface OfertaVista {
  id: number;
  tienda: Tienda;
  precio: number;
  envio: number;
  total: number;
  enStock: boolean;
  url: string;
  actualizado: Date;
  esMejor: boolean;
  tituloTienda: string | null; // nombre del producto tal como lo publica la tienda (para verificar)
}

// Consultas de precios: mejor oferta, ofertas por tienda, historial y bajadas de precio
@Injectable()
export class PreciosService {
  constructor(
    @InjectRepository(Oferta) private readonly ofertas: Repository<Oferta>,
    @InjectRepository(Tienda) private readonly tiendas: Repository<Tienda>,
    private readonly db: DataSource,
  ) {}

  // Mejor precio de cada componente (solo tiendas activas). Si no se pasan ids, de todos.
  async mejoresPrecios(ids?: number[]): Promise<Map<number, ResumenPrecio>> {
    if (ids && !ids.length) return new Map();
    const filtro = ids ? `AND o.componenteId IN (${ids.map(() => '?').join(',')})` : '';
    const filas: { cid: number; precio: number; enStock: number; tid: number; nombre: string; color: string }[] =
      await this.db.query(
        `SELECT o.componenteId AS cid, o.precio, o.enStock, t.id AS tid, t.nombre, t.color
           FROM ofertas o JOIN tiendas t ON t.id = o.tiendaId
          WHERE t.activa = 1 ${filtro}`,
        ids ?? [],
      );

    const mapa = new Map<number, ResumenPrecio>();
    for (const o of filas) {
      const enStock = !!o.enStock;
      const r = mapa.get(o.cid) ?? { mejor: null, tienda: null, ofertas: 0, conStock: 0, hayStock: false };
      r.ofertas++;
      if (enStock) r.conStock++;
      // Se prefiere una oferta con stock; entre iguales, la más barata
      const mejora = r.mejor === null || (enStock && !r.hayStock) || (enStock === r.hayStock && o.precio < r.mejor);
      if (mejora) {
        r.mejor = o.precio;
        r.hayStock = enStock;
        r.tienda = { id: o.tid, nombre: o.nombre, color: o.color };
      }
      mapa.set(o.cid, r);
    }
    return mapa;
  }

  async mejorPrecio(componenteId: number): Promise<ResumenPrecio> {
    return (await this.mejoresPrecios([componenteId])).get(componenteId) ?? {
      mejor: null, tienda: null, ofertas: 0, conStock: 0, hayStock: false,
    };
  }

  // Ofertas de un componente ordenadas: primero con stock, luego por precio total
  async ofertasDe(componenteId: number): Promise<OfertaVista[]> {
    const lista = await this.ofertas.find({
      where: { componente: { id: componenteId }, tienda: { activa: true } },
    });
    const vistas = lista.map((o) => ({
      id: o.id,
      tienda: o.tienda,
      precio: o.precio,
      envio: o.tienda.costoEnvio,
      total: Math.round((o.precio + o.tienda.costoEnvio) * 100) / 100,
      enStock: o.enStock,
      url: o.url,
      actualizado: o.actualizado,
      esMejor: false,
      tituloTienda: o.tituloTienda ?? null,
    }));
    vistas.sort((a, b) => Number(b.enStock) - Number(a.enStock) || a.precio - b.precio);
    if (vistas.length) vistas[0].esMejor = true;
    return vistas;
  }

  // Evolución del precio: mejor precio diario y una serie por tienda
  async historial(componenteId: number, dias = 90) {
    const desde = sumarDias(diaLocal(), -dias);
    const filas: { fecha: string; precio: number; tiendaId: number; nombre: string; color: string }[] = await this.db.query(
      `SELECT h.fecha, h.precio, t.id AS tiendaId, t.nombre, t.color
         FROM historial_precios h
         JOIN ofertas o ON o.id = h.ofertaId
         JOIN tiendas t ON t.id = o.tiendaId
        WHERE o.componenteId = ? AND t.activa = 1 AND h.fecha >= ?
        ORDER BY h.fecha`,
      [componenteId, desde],
    );

    const fechas = [...new Set(filas.map((f) => f.fecha))].sort();
    const indice = new Map(fechas.map((f, i) => [f, i]));
    const mejor: number[] = fechas.map(() => Infinity);
    const tiendas = new Map<number, { tienda: string; color: string; precios: (number | null)[] }>();

    for (const f of filas) {
      const i = indice.get(f.fecha);
      mejor[i] = Math.min(mejor[i], f.precio);
      if (!tiendas.has(f.tiendaId)) tiendas.set(f.tiendaId, { tienda: f.nombre, color: f.color, precios: fechas.map(() => null) });
      tiendas.get(f.tiendaId).precios[i] = f.precio;
    }

    const validos = mejor.filter((p) => Number.isFinite(p));
    const minimo = validos.length ? Math.min(...validos) : null;
    const maximo = validos.length ? Math.max(...validos) : null;
    const promedio = validos.length ? Math.round((validos.reduce((t, p) => t + p, 0) / validos.length) * 100) / 100 : null;
    const fechaMinimo = minimo !== null ? fechas[mejor.indexOf(minimo)] : null;

    return { dias, fechas, mejor, porTienda: [...tiendas.values()], minimo, maximo, promedio, fechaMinimo };
  }

  // Mejor precio de cada componente hace N días (para calcular variaciones)
  async preciosHace(dias: number): Promise<Map<number, number>> {
    const fecha = sumarDias(diaLocal(), -dias);
    const filas: { cid: number; precio: number }[] = await this.db.query(
      `SELECT o.componenteId AS cid, MIN(h.precio) AS precio
         FROM historial_precios h
         JOIN ofertas o ON o.id = h.ofertaId
         JOIN tiendas t ON t.id = o.tiendaId
        WHERE h.fecha = ? AND t.activa = 1
        GROUP BY o.componenteId`,
      [fecha],
    );
    return new Map(filas.map((f) => [f.cid, f.precio]));
  }

  // Variación porcentual del mejor precio frente a hace N días (negativa = bajó)
  async variaciones(dias = 7): Promise<Map<number, number>> {
    const [actual, antes] = await Promise.all([this.mejoresPrecios(), this.preciosHace(dias)]);
    const resultado = new Map<number, number>();
    for (const [cid, r] of actual) {
      const previo = antes.get(cid);
      if (previo && r.mejor) resultado.set(cid, Math.round(((r.mejor - previo) / previo) * 1000) / 10);
    }
    return resultado;
  }

  listarTiendas() {
    return this.tiendas.find({ order: { nombre: 'ASC' } });
  }

  async estadisticasTiendas() {
    const filas = await this.db.query(
      `SELECT t.id, t.nombre, t.color, t.activa, t.costoEnvio, t.diasEntrega, t.valoracion, t.sitioWeb,
              t.fuente, t.ciudad, t.pais, t.ultimaSincronizacion, t.ultimoError,
              COUNT(o.id) AS ofertas, COALESCE(SUM(o.enStock), 0) AS conStock, MAX(o.actualizado) AS actualizado
         FROM tiendas t LEFT JOIN ofertas o ON o.tiendaId = t.id
        GROUP BY t.id ORDER BY t.fuente = 'simulada', t.nombre`,
    );
    // Las consultas SQL crudas devuelven texto; se convierten a fechas UTC y booleanos reales
    return filas.map((f: any) => ({
      ...f,
      activa: !!f.activa,
      ultimaSincronizacion: fechaUtc(f.ultimaSincronizacion),
      actualizado: fechaUtc(f.actualizado),
    }));
  }

  async alternarTienda(id: number) {
    const t = await this.tiendas.findOneBy({ id });
    if (t) await this.tiendas.update(id, { activa: !t.activa });
  }

  async ultimaActualizacion(): Promise<Date | null> {
    const { fecha } = await this.ofertas.createQueryBuilder('o').select('MAX(o.actualizado)', 'fecha').getRawOne();
    return fechaUtc(fecha);
  }

  contarOfertas() {
    return this.ofertas.count();
  }

  // Crea o actualiza el precio manual de un componente en una tienda (una oferta por par)
  async guardarOferta(datos: { componenteId: number; tiendaId: number; precio: number; enStock: boolean; url: string }) {
    const tienda = await this.tiendas.findOneBy({ id: datos.tiendaId });
    if (!tienda) throw new NotFoundException('Esa tienda no existe');
    const componente = await this.db.getRepository(Componente).findOneBy({ id: datos.componenteId });
    if (!componente) throw new NotFoundException('Ese componente no existe');

    const cambios = { precio: datos.precio, enStock: datos.enStock, url: datos.url, actualizado: new Date() };
    const existente = await this.ofertas.findOne({ where: { componente: { id: componente.id }, tienda: { id: tienda.id } } });
    if (existente) {
      await this.ofertas.update(existente.id, cambios);
      return existente.id;
    }
    const nueva = await this.ofertas.save(this.ofertas.create({ ...cambios, componente, tienda }));
    return nueva.id;
  }
}

// SQLite guarda las fechas como texto UTC sin zona ("2026-10-13 02:00:00.064").
// new Date() las leería como hora local; se marca explícitamente como UTC.
export function fechaUtc(valor: string | Date | null): Date | null {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(valor) ? valor : `${valor.replace(' ', 'T')}Z`);
}
