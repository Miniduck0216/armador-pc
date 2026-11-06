import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuracion, UsoConfiguracion } from './configuracion.entity';
import { ConfiguradorService } from '../configurador/configurador.service';
import { ComponentesService } from '../componentes/componentes.service';

@Injectable()
export class ConfiguracionesService {
  constructor(
    @InjectRepository(Configuracion) private readonly repo: Repository<Configuracion>,
    private readonly configurador: ConfiguradorService,
    private readonly componentes: ComponentesService,
  ) {}

  // Cada configuración con su precio actual, piezas clave y datos resumidos (RAM, SSD, VRAM, fuente)
  async listar(uso?: UsoConfiguracion) {
    const lista = await this.repo.find({ where: uso ? { uso } : {}, order: { orden: 'ASC' } });
    return Promise.all(lista.map((c) => this.vista(c)));
  }

  async obtener(slug: string) {
    const c = await this.repo.findOne({ where: { slug } });
    if (!c) throw new NotFoundException('Esa configuración no existe');
    return this.vista(c);
  }

  private async vista(c: Configuracion) {
    const resumen = await this.configurador.resumen(c.piezas);
    const piezas = await this.componentes.buscarPorIds(c.piezas);
    const de = (codigo: string) => piezas.find((p) => p.categoria.codigo === codigo);
    const atributo = (codigo: string, clave: string) => de(codigo)?.atributos?.[clave];
    const chips = [
      atributo('RAM', 'Capacidad')?.split(' (')[0] && `${atributo('RAM', 'Capacidad').split(' (')[0]} RAM`,
      atributo('ALMAC', 'Capacidad') && `${atributo('ALMAC', 'Capacidad')} SSD`,
      atributo('GPU', 'Memoria') && `${atributo('GPU', 'Memoria').split(' ')[0]} GB VRAM`,
      de('FUENTE')?.potenciaW && `${de('FUENTE').potenciaW} W`,
    ].filter(Boolean);

    return {
      ...c,
      total: resumen.total,
      compatible: resumen.compatibilidad.esCompatible,
      rendimiento: resumen.rendimiento,
      cantidadPiezas: resumen.piezas.length,
      chips,
      destacadas: ['CPU', 'GPU', 'RAM', 'ALMAC']
        .map((codigo) => resumen.piezas.find((p) => p.categoria === codigo))
        .filter(Boolean)
        .map((p) => ({ categoria: p.categoria, nombre: p.nombre })),
      piezasDetalle: resumen.piezas,
    };
  }

  // Se arma con el modo automático del configurador para cada presupuesto y uso
  async crearDesdePresupuesto(datos: Omit<Configuracion, 'id' | 'piezas'>, usoConfigurador: 'juegos' | 'trabajo', sinGrafica = false) {
    const sugerido = await this.configurador.sugerir(datos.presupuesto, usoConfigurador, { sinGrafica });
    return this.repo.save(this.repo.create({ ...datos, piezas: sugerido.ids }));
  }

  contar() {
    return this.repo.count();
  }
}
