import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from '../categorias/categoria.entity';
import { Componente } from '../componentes/componente.entity';
import { ReglaCompatibilidad } from '../reglas/regla-compatibilidad.entity';
import { Tienda } from '../precios/entidades/tienda.entity';
import { ProcesadoresService } from '../procesadores/procesadores.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { PROVEEDOR_PRECIOS, ProveedorPrecios } from '../precios/proveedor-precios';
import { MODO_PRECIOS, TareaPreciosService } from '../precios/tarea-precios.service';
import { ConfiguracionesService } from '../configuraciones/configuraciones.service';
import { GuiasService } from '../guias/guias.module';
import { PROCESADORES } from './datos-procesadores';
import { CATEGORIAS, COMPONENTES, REGLAS, TIENDAS } from './datos-catalogo';
import { GUIAS } from './datos-guias';
import { BUSQUEDAS, fotoPara } from './extras';
import { FOTOS, FOTO_CATEGORIA } from './imagenes';

export const ADMIN = { correo: 'admin@armadorpc.com', contrasena: 'Admin12345' };
export const DEMO = { correo: 'demo@armadorpc.com', contrasena: 'Demo12345' };

// Configuraciones recomendadas: se arman con el modo automático del configurador
const CONFIGURACIONES = [
  { slug: 'dia-a-dia', titulo: 'PC ágil para estudiar, trabajar y navegar', uso: 'trabajo', etiqueta: 'Uso diario', antetitulo: 'Para el día a día',
    descripcion: 'Equilibrado para ofimática, muchas pestañas, videollamadas y clases en línea, sin pagar por potencia que no vas a usar.',
    presupuesto: 650, recomendada: false, foto: FOTOS.escenaOficina, orden: 1, modo: 'trabajo', sinGrafica: true },
  { slug: 'gaming-1080p', titulo: 'Gaming equilibrado para 1080p', uso: 'gaming', etiqueta: 'Gaming · 1080p', antetitulo: 'Para jugar sin parar',
    descripcion: 'Pensado para jugar con fluidez en 1080p, priorizando la tarjeta gráfica y dejando espacio para mejorar después.',
    presupuesto: 1000, recomendada: false, foto: FOTOS.escenaDosMonitores, orden: 2, modo: 'juegos' },
  { slug: 'gaming-1440p', titulo: 'Gaming potente para 1440p', uso: 'gaming', etiqueta: 'Gaming · 1440p', antetitulo: 'El punto dulce',
    descripcion: 'Más margen gráfico para 1440p y altas tasas de refresco sin saltar a una configuración extrema.',
    presupuesto: 1600, recomendada: true, foto: FOTOS.escenaGamingRgb, orden: 3, modo: 'juegos' },
  { slug: 'gaming-4k', titulo: 'Gaming de alto rendimiento para 4K', uso: 'gaming', etiqueta: 'Gaming · 4K', antetitulo: 'Máximo nivel gráfico',
    descripcion: 'Una base ambiciosa para jugar en 4K con calidad alta, con fuente y refrigeración a la altura.',
    presupuesto: 2700, recomendada: false, foto: FOTOS.escenaArmado, orden: 4, modo: 'juegos' },
  { slug: 'creacion', titulo: 'Edición, diseño y creación de contenido', uso: 'creacion', etiqueta: 'Creación', antetitulo: 'Para crear contenido',
    descripcion: 'Centrada en multitarea, edición de foto y video, con memoria y almacenamiento rápido para proyectos pesados.',
    presupuesto: 2000, recomendada: false, foto: FOTOS.escenaEdicion, orden: 5, modo: 'trabajo' },
  { slug: 'workstation', titulo: 'Render, 3D y cargas profesionales', uso: 'creacion', etiqueta: 'Workstation', antetitulo: 'Para trabajos exigentes',
    descripcion: 'Orientada a renderizado, 3D y tareas profesionales intensivas, con más procesador, memoria y margen térmico.',
    presupuesto: 3200, recomendada: false, foto: FOTOS.escenaTorre, orden: 6, modo: 'trabajo' },
] as const;

@Injectable()
export class SemillaService implements OnApplicationBootstrap {
  private readonly log = new Logger('Semilla');

  constructor(
    @InjectRepository(Categoria) private readonly categorias: Repository<Categoria>,
    @InjectRepository(Componente) private readonly componentes: Repository<Componente>,
    @InjectRepository(ReglaCompatibilidad) private readonly reglas: Repository<ReglaCompatibilidad>,
    @InjectRepository(Tienda) private readonly tiendas: Repository<Tienda>,
    @Inject(PROVEEDOR_PRECIOS) private readonly simulador: ProveedorPrecios,
    private readonly procesadores: ProcesadoresService,
    private readonly usuarios: UsuariosService,
    private readonly tarea: TareaPreciosService,
    private readonly configuraciones: ConfiguracionesService,
    private readonly guias: GuiasService,
  ) {}

  async onApplicationBootstrap() {
    if ((await this.categorias.count()) === 0) await this.sembrar();
    await this.asegurarTiendas();
    await this.tarea.aplicarModo();

    // Modo real: la primera consulta a las tiendas tarda unos minutos, se hace en segundo plano.
    // Modo demo: rellena los días en que el servidor estuvo apagado (es instantáneo).
    if (MODO_PRECIOS === 'demo') await this.tarea.ejecutar();
    else if (process.env.PRECIOS_AL_INICIAR !== 'no') this.tarea.enSegundoPlano();
  }

  // Agrega las tiendas nuevas del catálogo a bases que ya existían (sin duplicar las que ya están)
  private async asegurarTiendas() {
    for (const t of TIENDAS) {
      if (!(await this.tiendas.findOne({ where: { nombre: t.nombre } }))) await this.tiendas.save(this.tiendas.create(t));
    }
  }

  private async sembrar() {
    const inicio = Date.now();
    await this.tiendas.save(TIENDAS.map((t) => this.tiendas.create(t)));

    const guardadas = await this.categorias.save(
      CATEGORIAS.map((c) => this.categorias.create({ ...c, imagenUrl: FOTO_CATEGORIA[c.codigo]?.url })),
    );
    const porCodigo = new Map(guardadas.map((c) => [c.codigo, c]));

    const piezas = await this.componentes.save(
      COMPONENTES.map(({ cat, ...datos }) => {
        const foto = fotoPara({ ...datos, cat });
        return this.componentes.create({
          ...datos,
          categoria: porCodigo.get(cat),
          imagenUrl: foto.url,
          imagenCredito: foto.credito,
          busqueda: BUSQUEDAS[datos.nombre],
        });
      }),
    );
    // Historial de demostración (solo lo usan las tiendas ficticias del modo demo)
    for (const pieza of piezas) await this.simulador.registrarComponente(pieza);

    // Procesadores con ficha técnica completa
    for (const p of PROCESADORES) {
      const creado = await this.procesadores.crear(p);
      const foto = fotoPara({ ...creado, cat: 'CPU' });
      await this.componentes.update(creado.id, { imagenUrl: foto.url, imagenCredito: foto.credito });
    }
    await this.reglas.save(REGLAS.map((r) => this.reglas.create(r)));

    // Cuentas de prueba (cámbialas antes de publicar el proyecto)
    await this.usuarios.crear('Administrador', ADMIN.correo, ADMIN.contrasena, 'admin');
    await this.usuarios.crear('Usuario de prueba', DEMO.correo, DEMO.contrasena, 'usuario');

    for (const { foto, modo, ...c } of CONFIGURACIONES) {
      const { sinGrafica, ...datos } = c as typeof c & { sinGrafica?: boolean };
      await this.configuraciones.crearDesdePresupuesto({ ...datos, imagenUrl: foto.url, imagenCredito: foto.credito }, modo, !!sinGrafica);
    }
    await this.guias.guardarTodas(GUIAS);

    this.log.log(
      `Base de datos inicializada en ${((Date.now() - inicio) / 1000).toFixed(1)} s: ` +
        `${piezas.length + PROCESADORES.length} componentes, ${TIENDAS.length} tiendas, ${CONFIGURACIONES.length} configuraciones, ${GUIAS.length} guías. ` +
        `Cuentas de prueba: ${ADMIN.correo} y ${DEMO.correo}`,
    );
  }
}
