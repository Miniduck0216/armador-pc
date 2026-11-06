import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Componente } from '../componentes/componente.entity';
import { Categoria } from '../categorias/categoria.entity';
import { EspecificacionCpu } from './especificacion-cpu.entity';
import { DesglosePuntaje, PuntajeService } from './puntaje.service';
import { FiltrosProcesadorDto, ProcesadorDto } from './dto/procesador.dto';
import { PreciosService } from '../precios/precios.service';
import { PROVEEDOR_PRECIOS, ProveedorPrecios } from '../precios/proveedor-precios';
import { SincronizadorService } from '../precios/sincronizador.service';
import { MODO_PRECIOS } from '../precios/tarea-precios.service';

// Objeto plano que se entrega a las vistas y a la API: une componente, ficha y puntaje
export interface ProcesadorVista {
  id: number;
  nombre: string;
  marca: string;
  nombreCompleto: string;
  precio: number; // mejor precio actual entre tiendas (o el de referencia si no hay ofertas)
  precioReferencia: number;
  tiendaMejorPrecio: string | null;
  ofertas: number;
  zocalo: string;
  puntos: number;
  posicion: number; // lugar en el ranking general
  puntosPorDolar: number;
  desglose: DesglosePuntaje[];
  nucleos: number;
  hilos: number;
  frecuenciaBase: number;
  frecuenciaTurbo: number;
  cacheL3: number;
  tdp: number;
  litografia: number;
  anioLanzamiento: number;
  graficosIntegrados: boolean;
  nombreGraficos: string;
  memoriaSoportada: string;
  velocidadMemoriaMax: number;
  versionPcie: number;
  desbloqueado: boolean;
  cinebenchMono: number;
  cinebenchMulti: number;
}

const ORDENES: Record<string, (a: ProcesadorVista, b: ProcesadorVista) => number> = {
  puntos: (a, b) => b.puntos - a.puntos,
  precio_asc: (a, b) => a.precio - b.precio,
  precio_desc: (a, b) => b.precio - a.precio,
  valor: (a, b) => b.puntosPorDolar - a.puntosPorDolar,
  nucleos: (a, b) => b.nucleos - a.nucleos || b.puntos - a.puntos,
  mono: (a, b) => b.cinebenchMono - a.cinebenchMono,
  multi: (a, b) => b.cinebenchMulti - a.cinebenchMulti,
  reciente: (a, b) => b.anioLanzamiento - a.anioLanzamiento || b.puntos - a.puntos,
};

@Injectable()
export class ProcesadoresService {
  constructor(
    @InjectRepository(Componente) private readonly componentes: Repository<Componente>,
    @InjectRepository(EspecificacionCpu) private readonly especs: Repository<EspecificacionCpu>,
    @InjectRepository(Categoria) private readonly categorias: Repository<Categoria>,
    private readonly puntaje: PuntajeService,
    private readonly db: DataSource,
    private readonly precios: PreciosService,
    @Inject(PROVEEDOR_PRECIOS) private readonly proveedor: ProveedorPrecios,
    private readonly sincronizador: SincronizadorService,
  ) {}

  // Carga todos los procesadores con su ficha y calcula puntaje y posición
  async todos(): Promise<ProcesadorVista[]> {
    const especs = await this.especs.find({ relations: { componente: true } });
    const puntajes = this.puntaje.calcularTodos(especs);
    const precios = await this.precios.mejoresPrecios(especs.map((e) => e.componente.id));

    const lista = especs.map((e) => {
      const c = e.componente;
      const { puntos, desglose } = puntajes.get(e.id);
      const precio = precios.get(c.id);
      const precioActual = precio?.mejor ?? c.precio;
      const { id: _id, componente: _c, ...ficha } = e;
      return {
        ...ficha,
        id: c.id,
        nombre: c.nombre,
        marca: c.marca,
        nombreCompleto: `${c.marca} ${c.nombre}`,
        precio: precioActual,
        precioReferencia: c.precio,
        tiendaMejorPrecio: precio?.tienda?.nombre ?? null,
        ofertas: precio?.ofertas ?? 0,
        zocalo: c.zocalo,
        puntos,
        desglose,
        puntosPorDolar: Math.round((puntos / precioActual) * 1000) / 10,
        posicion: 0,
      } as ProcesadorVista;
    });

    lista.sort(ORDENES.puntos).forEach((p, i) => (p.posicion = i + 1));
    return lista;
  }

  async listar(f: FiltrosProcesadorDto = {}): Promise<ProcesadorVista[]> {
    const texto = f.buscar?.trim().toLowerCase();
    const marcas = f.marca ? f.marca.split(',').filter(Boolean) : [];

    const lista = (await this.todos()).filter(
      (p) =>
        (!texto || p.nombreCompleto.toLowerCase().includes(texto)) &&
        (!marcas.length || marcas.includes(p.marca)) &&
        (!f.zocalo || p.zocalo === f.zocalo) &&
        (!f.memoria || p.memoriaSoportada.includes(f.memoria)) &&
        (!f.nucleosMin || p.nucleos >= f.nucleosMin) &&
        (!f.precioMin || p.precio >= f.precioMin) &&
        (!f.precioMax || p.precio <= f.precioMax) &&
        (!f.anioMin || p.anioLanzamiento >= f.anioMin) &&
        (f.graficos !== 'si' || p.graficosIntegrados) &&
        (f.desbloqueado !== 'si' || p.desbloqueado),
    );
    return lista.sort(ORDENES[f.orden] ?? ORDENES.puntos);
  }

  async obtener(id: number): Promise<ProcesadorVista> {
    const p = (await this.todos()).find((x) => x.id === id);
    if (!p) throw new NotFoundException('Ese procesador no existe');
    return p;
  }

  // Valores que alimentan los filtros del ranking
  async opcionesFiltro() {
    const lista = await this.todos();
    const unicos = (valores: any[]) => [...new Set(valores)].sort();
    const precios = lista.map((p) => p.precio);
    return {
      marcas: unicos(lista.map((p) => p.marca)),
      zocalos: unicos(lista.map((p) => p.zocalo)),
      anios: unicos(lista.map((p) => p.anioLanzamiento)).reverse(),
      precioMin: Math.floor(Math.min(...precios)),
      precioMax: Math.ceil(Math.max(...precios)),
    };
  }

  // Promedio del catálogo: sirve para los "puntos a favor y en contra" de la ficha
  async promedio(): Promise<Record<string, any>> {
    const lista = await this.todos();
    const media = (f: (p: ProcesadorVista) => number) => lista.reduce((t, p) => t + f(p), 0) / lista.length;
    const claves = ['nucleos', 'hilos', 'frecuenciaBase', 'frecuenciaTurbo', 'cacheL3', 'tdp', 'litografia',
      'velocidadMemoriaMax', 'versionPcie', 'cinebenchMono', 'cinebenchMulti', 'precio', 'puntosPorDolar', 'anioLanzamiento'];
    const promedio: Record<string, any> = {};
    for (const c of claves) promedio[c] = Math.round(media((p) => p[c]) * 10) / 10;
    promedio.anioLanzamiento = Math.round(promedio.anioLanzamiento);
    promedio.graficosIntegrados = false;
    promedio.desbloqueado = false;
    return promedio;
  }

  // ---- Administración ----

  async crear(dto: ProcesadorDto) {
    const categoria = await this.categorias.findOneByOrFail({ codigo: 'CPU' });
    const creado = await this.db.transaction(async (tx) => {
      const componente = await tx.save(
        tx.create(Componente, {
          ...this.datosComponente(dto), categoria,
        }),
      );
      await tx.save(tx.create(EspecificacionCpu, { ...this.ficha(dto), componente }));
      return componente;
    });
    await this.proveedor.registrarComponente(creado); // datos de demostración
    await this.sincronizarPuntajes();
    if (MODO_PRECIOS === 'real') this.sincronizador.sincronizar([creado.id]).catch(() => undefined); // precios reales
    return creado;
  }

  async actualizar(id: number, dto: ProcesadorDto) {
    const espec = await this.especs.findOne({ where: { componente: { id } }, relations: { componente: true } });
    if (!espec) throw new NotFoundException('Ese procesador no existe');
    await this.db.transaction(async (tx) => {
      await tx.update(Componente, id, this.datosComponente(dto));
      await tx.update(EspecificacionCpu, espec.id, this.ficha(dto));
    });
    await this.proveedor.rebasar(id, espec.componente.precio, dto.precio);
    await this.sincronizarPuntajes();
  }

  async eliminar(id: number) {
    await this.componentes.delete(id); // la ficha se borra en cascada
    await this.sincronizarPuntajes();
  }

  // El armador de PC usa componente.puntajeRendimiento; aquí se mantiene actualizado
  async sincronizarPuntajes() {
    for (const p of await this.todos()) {
      await this.componentes.update(p.id, { puntajeRendimiento: p.puntos });
    }
  }

  // Datos comunes del componente (los usan el catálogo y las reglas de compatibilidad)
  private datosComponente(dto: ProcesadorDto): Partial<Componente> {
    return {
      nombre: dto.nombre,
      marca: dto.marca,
      precio: dto.precio,
      zocalo: dto.zocalo,
      consumoW: dto.tdp,
      tipoMemoria: dto.memoriaSoportada,
      atributos: {
        'Núcleos / hilos': `${dto.nucleos} / ${dto.hilos}`,
        'Frecuencia turbo': `${String(dto.frecuenciaTurbo).replace('.', ',')} GHz`,
        'Caché L3': `${dto.cacheL3} MB`,
        'Gráficos integrados': dto.graficosIntegrados ? dto.nombreGraficos || 'Sí' : 'No',
      },
    };
  }

  private ficha(dto: ProcesadorDto): Partial<EspecificacionCpu> {
    const { nombre: _n, marca: _m, precio: _p, zocalo: _z, ...ficha } = dto;
    return { ...ficha, nombreGraficos: dto.graficosIntegrados ? dto.nombreGraficos || null : null };
  }
}
