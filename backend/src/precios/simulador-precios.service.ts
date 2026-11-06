import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Componente } from '../componentes/componente.entity';
import { Tienda } from './entidades/tienda.entity';
import { Oferta } from './entidades/oferta.entity';
import { HistorialPrecio } from './entidades/historial-precio.entity';
import { ProveedorPrecios, ResultadoActualizacion } from './proveedor-precios';
import { diaLocal, diasEntre, sumarDias } from './fechas';

const DIAS_HISTORIAL = 90;

// Generador de números pseudoaleatorios con semilla (mulberry32): mismos datos en cada instalación
function crearAleatorio(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Número fijo entre 0 y 1 a partir de un texto (para que cada tienda tenga su "personalidad")
function hash01(texto: string) {
  let h = 2166136261;
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

// Precios terminados en ,99 como en las tiendas
const redondear = (p: number) => Math.max(1, Math.round(p) - 0.01);

// Simula el mercado: cada oferta sigue una caminata aleatoria que tiende a su
// precio "normal", con descuentos ocasionales y cambios de disponibilidad.
@Injectable()
export class SimuladorPreciosService implements ProveedorPrecios {
  private readonly log = new Logger('Precios');
  private aleatorio = crearAleatorio(Number(process.env.SEMILLA_PRECIOS) || 2026);

  constructor(
    @InjectRepository(Tienda) private readonly tiendas: Repository<Tienda>,
    @InjectRepository(Oferta) private readonly ofertas: Repository<Oferta>,
    @InjectRepository(HistorialPrecio) private readonly historial: Repository<HistorialPrecio>,
    private readonly db: DataSource,
  ) {}

  // Precio al que tiende una oferta: referencia × factor de la tienda × factor del producto
  private precioObjetivo(componente: Componente, tienda: Tienda) {
    const factorTienda = 0.94 + hash01(tienda.nombre) * 0.1; // 0,94 a 1,04
    const factorProducto = 0.97 + hash01(`${componente.id}-${tienda.id}`) * 0.07; // 0,97 a 1,04
    return componente.precio * factorTienda * factorProducto;
  }

  // Un paso de la simulación (un día)
  private siguientePrecio(actual: number, objetivo: number) {
    const r = this.aleatorio();
    if (r < 0.035) return actual * (0.84 + this.aleatorio() * 0.08); // oferta relámpago: -8 % a -16 %
    if (r < 0.05) return actual * (1.04 + this.aleatorio() * 0.05); // subida puntual
    const ruido = (this.aleatorio() - 0.5) * 0.02 * objetivo;
    return actual + (objetivo - actual) * 0.12 + ruido;
  }

  async registrarComponente(componente: Componente) {
    const tiendas = await this.tiendas.find({ where: { fuente: 'simulada' } });
    // Cada producto está en entre 3 y todas las tiendas
    let elegidas = tiendas.filter(() => this.aleatorio() < 0.8);
    if (elegidas.length < 3) elegidas = tiendas.slice(0, 3);

    const hoy = diaLocal();
    const inicio = sumarDias(hoy, -DIAS_HISTORIAL);
    const filas: { oferta: { id: number }; fecha: string; precio: number }[] = [];

    await this.db.transaction(async (tx) => {
      for (const tienda of elegidas) {
        const objetivo = this.precioObjetivo(componente, tienda);
        // El historial arranca algo más caro: los precios de hardware suelen bajar con el tiempo
        let precio = objetivo * (1.02 + this.aleatorio() * 0.12);
        const serie: { fecha: string; precio: number }[] = [];
        for (let d = 0; d <= DIAS_HISTORIAL; d++) {
          precio = this.siguientePrecio(precio, objetivo);
          serie.push({ fecha: sumarDias(inicio, d), precio: redondear(precio) });
        }
        const actual = serie[serie.length - 1].precio;
        const oferta = await tx.save(
          tx.create(Oferta, {
            componente: { id: componente.id },
            tienda,
            precio: actual,
            enStock: this.aleatorio() > 0.12,
            url: `${tienda.sitioWeb}/producto/${componente.id}`,
            actualizado: new Date(),
          }),
        );
        serie.forEach((s) => filas.push({ oferta: { id: oferta.id }, ...s }));
      }
      // Inserción por lotes: mucho más rápido que guardar fila por fila
      for (let i = 0; i < filas.length; i += 400) {
        await tx.createQueryBuilder().insert().into(HistorialPrecio).values(filas.slice(i, i + 400)).execute();
      }
    });
  }

  async rebasar(componenteId: number, precioAnterior: number, precioNuevo: number) {
    if (!precioAnterior || precioAnterior === precioNuevo) return;
    const factor = precioNuevo / precioAnterior;
    const hoy = diaLocal();
    const ofertas = await this.ofertas.find({ where: { componente: { id: componenteId } } });
    for (const o of ofertas) {
      const precio = redondear(o.precio * factor);
      await this.ofertas.update(o.id, { precio, actualizado: new Date() });
      await this.guardarDia(o.id, hoy, precio);
    }
  }

  // Avanza la simulación hasta hoy: rellena los días en que el servidor estuvo apagado
  // y ajusta el precio del día actual.
  async actualizar(): Promise<ResultadoActualizacion> {
    const hoy = diaLocal();
    const { ultimo } = await this.historial
      .createQueryBuilder('h')
      .innerJoin('h.oferta', 'o')
      .innerJoin('o.tienda', 't')
      .where("t.fuente = 'simulada'")
      .select('MAX(h.fecha)', 'ultimo')
      .getRawOne();

    const ofertas = await this.ofertas.find({ where: { tienda: { fuente: 'simulada' } }, relations: { componente: true } });
    if (!ofertas.length) return { ofertasActualizadas: 0, diasSimulados: 0, fecha: new Date() };

    // Días por simular (como máximo el tamaño del historial)
    const pendientes = ultimo ? Math.min(diasEntre(ultimo, hoy), DIAS_HISTORIAL) : 0;
    const dias = pendientes > 0 ? Array.from({ length: pendientes }, (_, i) => sumarDias(hoy, i - pendientes + 1)) : [hoy];

    // Si ya hay datos de hoy, solo cambian algunas ofertas (los precios no se mueven cada hora)
    const mismoDia = pendientes === 0 && ultimo === hoy;

    await this.db.transaction(async (tx) => {
      for (const o of ofertas) {
        const objetivo = this.precioObjetivo(o.componente, o.tienda);
        let precio = o.precio;
        if (mismoDia && this.aleatorio() > 0.15) continue;
        for (const dia of dias) {
          precio = redondear(this.siguientePrecio(precio, objetivo));
          await tx.query(
            `INSERT INTO historial_precios (ofertaId, fecha, precio) VALUES (?, ?, ?)
             ON CONFLICT(ofertaId, fecha) DO UPDATE SET precio = excluded.precio`,
            [o.id, dia, precio],
          );
        }
        // Disponibilidad: a veces se agota y luego vuelve
        const enStock = o.enStock ? this.aleatorio() > 0.03 : this.aleatorio() > 0.6;
        await tx.update(Oferta, o.id, { precio, enStock, actualizado: new Date() });
      }
    });

    this.log.log(`Precios actualizados: ${ofertas.length} ofertas, ${dias.length} día(s)`);
    return { ofertasActualizadas: ofertas.length, diasSimulados: pendientes, fecha: new Date() };
  }

  private async guardarDia(ofertaId: number, fecha: string, precio: number) {
    await this.db.query(
      `INSERT INTO historial_precios (ofertaId, fecha, precio) VALUES (?, ?, ?)
       ON CONFLICT(ofertaId, fecha) DO UPDATE SET precio = excluded.precio`,
      [ofertaId, fecha, precio],
    );
  }
}
