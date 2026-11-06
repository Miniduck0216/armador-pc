import { BadRequestException, Injectable } from '@nestjs/common';
import { Componente } from '../componentes/componente.entity';
import { ComponentesService } from '../componentes/componentes.service';
import { CategoriasService } from '../categorias/categorias.service';
import { PreciosService, ResumenPrecio } from '../precios/precios.service';
import { ReglasService } from '../reglas/reglas.service';
import { CompatibilidadService } from './compatibilidad.service';
import { RendimientoService, Uso } from './rendimiento.service';
import { destacados } from '../productos/productos.service';

export interface PiezaResumen {
  id: number;
  nombre: string;
  marca: string;
  categoria: string;
  categoriaNombre: string;
  precio: number;
  precioReferencia: number;
  tienda: { id: number; nombre: string; color: string } | null;
  enStock: boolean;
  consumoW: number;
  puntaje: number;
  conflicto: boolean; // participa en una regla que no se cumple
  imagen: string | null;
  tieneOfertas: boolean; // false = solo hay precio de referencia
}

// Reparto del presupuesto por categoría cuando se arma automáticamente
const REPARTO: Record<string, number> = { RAM: 0.08, ALMAC: 0.07 };

@Injectable()
export class ConfiguradorService {
  constructor(
    private readonly componentes: ComponentesService,
    private readonly categorias: CategoriasService,
    private readonly precios: PreciosService,
    private readonly reglas: ReglasService,
    private readonly compatibilidad: CompatibilidadService,
    private readonly rendimiento: RendimientoService,
  ) {}

  // Convierte "1,2,3" o [1,2,3] en una lista de ids válida
  static ids(valor: string | number[] | undefined): number[] {
    const lista = Array.isArray(valor) ? valor : String(valor ?? '').split(',');
    return [...new Set(lista.map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 20);
  }

  async cargarPiezas(ids: number[]): Promise<Componente[]> {
    if (!ids.length) return [];
    const piezas = await this.componentes.buscarPorIds(ids);
    const codigos = piezas.map((p) => p.categoria.codigo);
    if (new Set(codigos).size !== codigos.length) {
      throw new BadRequestException('Solo puedes elegir una pieza por categoría');
    }
    return piezas.sort((a, b) => a.categoria.orden - b.categoria.orden);
  }

  // Todo lo que el configurador necesita saber de una selección de piezas
  async resumen(ids: number[], uso: Uso = 'juegos') {
    const piezas = await this.cargarPiezas(ids);
    const [precios, categorias, compat] = await Promise.all([
      this.precios.mejoresPrecios(piezas.map((p) => p.id)),
      this.categorias.listar(),
      this.compatibilidad.verificar(piezas),
    ]);

    const conConflicto = new Set(
      compat.resultados.filter((r) => !r.cumple && !r.omitida).flatMap((r) => r.categorias),
    );

    const lista: PiezaResumen[] = piezas.map((p) => this.pieza(p, precios.get(p.id), conConflicto.has(p.categoria.codigo)));
    const total = this.redondear(lista.reduce((t, p) => t + p.precio, 0));
    const totalReferencia = this.redondear(lista.reduce((t, p) => t + p.precioReferencia, 0));

    // Agrupa por la tienda que ofrece el mejor precio de cada pieza
    const porTienda = new Map<number, { tienda: string; color: string; piezas: string[]; subtotal: number }>();
    for (const p of lista.filter((x) => x.tienda)) {
      const g = porTienda.get(p.tienda.id) ?? { tienda: p.tienda.nombre, color: p.tienda.color, piezas: [], subtotal: 0 };
      g.piezas.push(p.nombre);
      g.subtotal = this.redondear(g.subtotal + p.precio);
      porTienda.set(p.tienda.id, g);
    }

    const elegidas = new Set(piezas.map((p) => p.categoria.codigo));
    const advertencias: string[] = [];
    const faltantes = categorias.filter((c) => c.obligatoria && !elegidas.has(c.codigo));
    if (faltantes.length) advertencias.push(`Falta elegir: ${faltantes.map((c) => c.nombre.toLowerCase()).join(', ')}`);
    const cpu = piezas.find((p) => p.categoria.codigo === 'CPU');
    if (cpu && !elegidas.has('GPU') && cpu.atributos?.['Gráficos integrados'] === 'No') {
      advertencias.push(`El ${cpu.nombre} no tiene gráficos integrados: necesitas una tarjeta gráfica para tener imagen`);
    }
    if (cpu && !elegidas.has('REFRIG') && cpu.consumoW > 65) {
      advertencias.push(`El ${cpu.nombre} no incluye disipador: agrega una refrigeración`);
    }
    lista.filter((p) => !p.enStock).forEach((p) => advertencias.push(`${p.nombre} está agotado en todas las tiendas`));

    return {
      piezas: lista,
      ids: piezas.map((p) => p.id),
      total,
      totalReferencia,
      ahorro: this.redondear(Math.max(0, totalReferencia - total)),
      consumo: piezas.filter((p) => p.categoria.codigo !== 'FUENTE').reduce((t, p) => t + (p.consumoW || 0), 0),
      completo: faltantes.length === 0,
      compatibilidad: compat,
      rendimiento: this.rendimiento.calcular(piezas, uso),
      porTienda: [...porTienda.values()].sort((a, b) => b.subtotal - a.subtotal),
      advertencias,
    };
  }

  // Piezas de una categoría con su precio y si encajan con lo ya elegido
  async opciones(codigo: string, ids: number[], buscar = '', orden = 'precio') {
    const [candidatos, seleccion, reglas] = await Promise.all([
      this.componentes.listar(codigo),
      this.cargarPiezas(ids),
      this.reglas.listarActivas(),
    ]);
    const precios = await this.precios.mejoresPrecios(candidatos.map((c) => c.id));
    const texto = buscar.trim().toLowerCase();
    const elegido = seleccion.find((s) => s.categoria.codigo === codigo)?.id ?? null;

    const resultado = [];
    for (const c of candidatos) {
      if (texto && !`${c.marca} ${c.nombre}`.toLowerCase().includes(texto)) continue;
      const motivo = await this.compatibilidad.conflicto(c, seleccion, reglas);
      const precio = precios.get(c.id);
      resultado.push({
        ...this.pieza(c, precio, false),
        destacados: destacados(c),
        ofertas: precio?.ofertas ?? 0,
        compatible: !motivo,
        motivo,
        elegido: c.id === elegido,
      });
    }

    const ordenes: Record<string, (a: any, b: any) => number> = {
      precio: (a, b) => a.precio - b.precio,
      precio_desc: (a, b) => b.precio - a.precio,
      rendimiento: (a, b) => b.puntaje - a.puntaje || a.precio - b.precio,
      nombre: (a, b) => `${a.marca} ${a.nombre}`.localeCompare(`${b.marca} ${b.nombre}`),
    };
    // Las compatibles siempre primero
    return resultado.sort((a, b) => Number(b.compatible) - Number(a.compatible) || (ordenes[orden] ?? ordenes.precio)(a, b));
  }

  // Modo rápido: arma automáticamente el mejor equipo posible para un presupuesto.
  // Prueba todas las combinaciones de procesador y tarjeta gráfica, completa el resto
  // con piezas compatibles y se queda con la de mayor rendimiento que entre en el presupuesto.
  async sugerir(presupuesto: number, uso: Uso = 'juegos', opciones: { sinGrafica?: boolean } = {}) {
    presupuesto = Math.round(Number(presupuesto));
    if (!Number.isFinite(presupuesto) || presupuesto < 100 || presupuesto > 20000) {
      throw new BadRequestException('El presupuesto debe estar entre $100 y $20.000');
    }

    const [todos, reglas] = await Promise.all([this.componentes.listar(), this.reglas.listarActivas()]);
    const precios = await this.precios.mejoresPrecios(todos.map((c) => c.id));
    const precio = (c: Componente) => precios.get(c.id)?.mejor ?? c.precio;
    const disponibles = todos.filter((c) => precios.get(c.id)?.hayStock !== false);
    const de = (codigo: string) => disponibles.filter((c) => c.categoria.codigo === codigo).sort((a, b) => precio(a) - precio(b));

    const cat = Object.fromEntries(['CPU', 'GPU', 'PLACA', 'RAM', 'ALMAC', 'REFRIG', 'FUENTE', 'CAJA'].map((c) => [c, de(c)]));

    // Elige la pieza más cara que entra en el tope (mejor calidad); si ninguna entra, la más barata
    const dentroDe = (lista: Componente[], tope: number) =>
      [...lista].reverse().find((c) => precio(c) <= tope) ?? lista[0];

    const compatibleCon = async (c: Componente, actuales: Componente[]) =>
      !(await this.compatibilidad.conflicto(c, actuales, reglas));
    const primeraCompatible = async (lista: Componente[], actuales: Componente[]) => {
      for (const c of lista) if (await compatibleCon(c, actuales)) return c;
      return null;
    };

    let mejor: { piezas: Componente[]; total: number; puntaje: number } | null = null;
    let minimo = Infinity;

    // Equipos de oficina: sin tarjeta gráfica, con un procesador que tenga gráficos integrados
    const tieneGraficos = (c: Componente) => !!c.atributos?.['Gráficos integrados'] && c.atributos['Gráficos integrados'] !== 'No';
    const cpus = opciones.sinGrafica ? cat.CPU.filter(tieneGraficos) : cat.CPU;
    const gpus: (Componente | null)[] = opciones.sinGrafica ? [null] : cat.GPU;

    for (const cpu of cpus) {
      for (const gpu of gpus) {
        const base = precio(cpu) + (gpu ? precio(gpu) : 0);
        if (base > presupuesto) continue;

        const piezas: Componente[] = gpu ? [cpu, gpu] : [cpu];
        const placa = await primeraCompatible(cat.PLACA, piezas);
        if (!placa) continue;
        piezas.push(placa);

        const rams = [];
        for (const r of cat.RAM) if (await compatibleCon(r, piezas)) rams.push(r);
        if (!rams.length) continue;
        piezas.push(dentroDe(rams, presupuesto * REPARTO.RAM));
        piezas.push(dentroDe(cat.ALMAC, presupuesto * REPARTO.ALMAC));

        const refrig = await primeraCompatible(cat.REFRIG, piezas);
        if (refrig) piezas.push(refrig);
        const caja = await primeraCompatible(cat.CAJA, piezas);
        if (caja) piezas.push(caja);
        const fuente = await primeraCompatible(cat.FUENTE, piezas);
        if (!fuente) continue;
        piezas.push(fuente);

        const total = this.redondear(piezas.reduce((t, p) => t + precio(p), 0));
        minimo = Math.min(minimo, total);
        if (total > presupuesto) continue;

        const porCategoria = new Map(piezas.map((p) => [p.categoria.codigo, p]));
        let puntaje = this.rendimiento.puntaje(porCategoria, uso);
        if (this.rendimiento.detectarCuello(porCategoria)) puntaje -= 4; // se prefieren equipos equilibrados
        if (!mejor || puntaje > mejor.puntaje || (puntaje === mejor.puntaje && total < mejor.total)) {
          mejor = { piezas, total, puntaje };
        }
      }
    }

    if (!mejor) {
      const sugerido = Number.isFinite(minimo) ? ` El equipo más económico posible cuesta $${minimo.toFixed(2)}.` : '';
      throw new BadRequestException(`No se puede armar un equipo completo con $${presupuesto}.${sugerido}`);
    }

    // Con el dinero que sobra se mejoran las piezas que no cambian el puntaje
    // (placa, refrigeración, caja), sin pasar de un tope razonable por categoría.
    const topes: Record<string, number> = { PLACA: 0.14, REFRIG: 0.06, CAJA: 0.07 };
    for (const codigo of ['PLACA', 'REFRIG', 'CAJA']) {
      const actual = mejor.piezas.find((p) => p.categoria.codigo === codigo);
      if (!actual) continue;
      const resto = mejor.piezas.filter((p) => p !== actual);
      const margen = presupuesto - (mejor.total - precio(actual));
      for (const c of [...cat[codigo]].reverse()) {
        if (precio(c) <= precio(actual) || precio(c) > margen || precio(c) > presupuesto * topes[codigo]) continue;
        if (codigo === 'PLACA' && c.formato === 'ITX' && actual.formato !== 'ITX') continue; // no achica el equipo
        if (!(await compatibleCon(c, resto))) continue;
        // La placa nueva no debe romper la compatibilidad de las demás piezas
        const prueba = await this.compatibilidad.verificar([...resto, c], reglas);
        if (!prueba.esCompatible) continue;
        mejor.piezas = [...resto, c];
        mejor.total = this.redondear(mejor.total - precio(actual) + precio(c));
        break;
      }
    }

    return {
      presupuesto,
      uso,
      sobrante: this.redondear(presupuesto - mejor.total),
      ...(await this.resumen(mejor.piezas.map((p) => p.id), uso)),
    };
  }

  private pieza(p: Componente, precio: ResumenPrecio | undefined, conflicto: boolean): PiezaResumen {
    return {
      id: p.id,
      nombre: `${p.marca} ${p.nombre}`,
      marca: p.marca,
      categoria: p.categoria.codigo,
      categoriaNombre: p.categoria.nombre,
      precio: precio?.mejor ?? p.precio,
      precioReferencia: p.precio,
      tienda: precio?.tienda ?? null,
      enStock: precio ? precio.hayStock : false,
      consumoW: p.consumoW,
      puntaje: p.puntajeRendimiento,
      conflicto,
      imagen: p.imagenTienda || p.imagenUrl || null,
      tieneOfertas: !!precio && precio.ofertas > 0,
    };
  }

  private redondear(n: number) {
    return Math.round(n * 100) / 100;
  }
}

