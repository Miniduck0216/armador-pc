import { Injectable } from '@nestjs/common';
import { ConfiguradorService } from '../configurador/configurador.service';
import { OfertaVista, PreciosService } from '../precios/precios.service';

interface TiendaRef {
  id: number;
  nombre: string;
  color: string;
}

export interface ProductoPedido {
  id: number;
  nombre: string;
  precio: number;
  url: string;
  enStock: boolean;
}

export interface GrupoTienda {
  tienda: TiendaRef;
  productos: ProductoPedido[];
  subtotal: number;
  envio: number;
  total: number;
}

// Calcula dónde comprar cada pieza y cuánto cuesta el pedido completo.
// Dos opciones que se comparan entre sí:
//  - "separado": cada pieza en la tienda más barata (se paga el envío una vez por tienda)
//  - "unaTienda": todas las piezas en una sola tienda que las tenga en stock
@Injectable()
export class PedidoService {
  constructor(
    private readonly configurador: ConfiguradorService,
    private readonly precios: PreciosService,
  ) {}

  async calcular(ids: number[]) {
    const piezas = await this.configurador.cargarPiezas(ids);
    const mapa = new Map<number, OfertaVista[]>();
    for (const p of piezas) mapa.set(p.id, await this.precios.ofertasDe(p.id));

    // 1) Mejor oferta por pieza: primero con stock, luego el precio más bajo
    const elegida = new Map<number, OfertaVista | null>();
    for (const p of piezas) {
      const ofertas = mapa.get(p.id) ?? [];
      const enStock = ofertas.filter((o) => o.enStock);
      const lista = enStock.length ? enStock : ofertas;
      lista.sort((a, b) => a.precio - b.precio);
      elegida.set(p.id, lista[0] ?? null);
    }

    const lineas = piezas.map((p) => {
      const o = elegida.get(p.id);
      return {
        id: p.id,
        nombre: `${p.marca} ${p.nombre}`,
        categoria: p.categoria.codigo,
        categoriaNombre: p.categoria.nombre,
        imagen: p.imagenTienda || p.imagenUrl || null,
        sinOferta: !o,
        sinStock: !!o && !o.enStock,
      };
    });

    // 2) Opción separada: agrupar por tienda y sumar un solo envío por tienda
    const grupos = new Map<number, GrupoTienda>();
    for (const p of piezas) {
      const o = elegida.get(p.id);
      if (!o) continue;
      const g = grupos.get(o.tienda.id) ?? {
        tienda: { id: o.tienda.id, nombre: o.tienda.nombre, color: o.tienda.color },
        productos: [],
        subtotal: 0,
        envio: o.envio,
        total: 0,
      };
      g.productos.push({ id: p.id, nombre: `${p.marca} ${p.nombre}`, precio: o.precio, url: o.url, enStock: o.enStock });
      g.subtotal = this.redondear(g.subtotal + o.precio);
      g.total = this.redondear(g.subtotal + g.envio);
      grupos.set(o.tienda.id, g);
    }
    const compraPorTienda = [...grupos.values()];
    const totalSeparado = this.redondear(compraPorTienda.reduce((t, g) => t + g.total, 0));
    const sinOferta = lineas.filter((l) => l.sinOferta).map((l) => l.nombre);
    const hayTodo = sinOferta.length === 0;

    // 3) Opción una sola tienda: solo si tiene todas las piezas en stock
    let unaTienda: { tienda: TiendaRef; total: number; subtotal: number; envio: number } | null = null;
    if (hayTodo && piezas.length) {
      const tiendas = new Map<number, { ref: TiendaRef; envio: number }>();
      for (const ofertas of mapa.values()) {
        for (const o of ofertas) tiendas.set(o.tienda.id, { ref: { id: o.tienda.id, nombre: o.tienda.nombre, color: o.tienda.color }, envio: o.envio });
      }
      for (const { ref, envio } of tiendas.values()) {
        let subtotal = 0;
        let completa = true;
        for (const p of piezas) {
          const o = (mapa.get(p.id) ?? []).find((x) => x.tienda.id === ref.id && x.enStock);
          if (!o) {
            completa = false;
            break;
          }
          subtotal += o.precio;
        }
        if (!completa) continue;
        const total = this.redondear(subtotal + envio);
        if (!unaTienda || total < unaTienda.total) {
          unaTienda = { tienda: ref, total, subtotal: this.redondear(subtotal), envio };
        }
      }
    }

    // 4) Recomendación: la opción más barata de las dos
    const recomendado = unaTienda && unaTienda.total < totalSeparado ? 'unaTienda' : 'separado';
    const ahorro = unaTienda && recomendado === 'unaTienda' ? this.redondear(totalSeparado - unaTienda.total) : 0;

    return {
      piezas: lineas,
      compraPorTienda,
      totalSeparado,
      unaTienda,
      recomendado,
      ahorro,
      total: recomendado === 'unaTienda' && unaTienda ? unaTienda.total : totalSeparado,
      sinOferta,
      sinStock: lineas.filter((l) => l.sinStock).map((l) => l.nombre),
    };
  }

  private redondear(n: number) {
    return Math.round(n * 100) / 100;
  }
}
