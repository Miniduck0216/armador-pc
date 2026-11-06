import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertaPrecio } from './entidades/alerta-precio.entity';
import { PreciosService } from './precios.service';

@Injectable()
export class AlertasService {
  private readonly log = new Logger('Alertas');

  constructor(
    @InjectRepository(AlertaPrecio) private readonly repo: Repository<AlertaPrecio>,
    private readonly precios: PreciosService,
  ) {}

  // Crea o reemplaza la alerta del usuario para ese componente
  async guardar(usuarioId: number, componenteId: number, precioObjetivo: number) {
    precioObjetivo = Math.round(Number(precioObjetivo) * 100) / 100;
    if (!Number.isFinite(precioObjetivo) || precioObjetivo <= 0) {
      throw new BadRequestException('Escribe un precio objetivo válido');
    }
    const { mejor } = await this.precios.mejorPrecio(componenteId);
    if (mejor === null) throw new NotFoundException('Ese componente no tiene ofertas');
    if (precioObjetivo >= mejor) {
      throw new BadRequestException(`Ya está a $${mejor.toFixed(2)}: elige un precio objetivo menor`);
    }

    const existente = await this.repo.findOne({ where: { usuario: { id: usuarioId }, componente: { id: componenteId } } });
    const datos = { precioObjetivo, precioInicial: mejor, disparada: false, precioAlcanzado: null, fechaDisparo: null, vista: false };
    if (existente) {
      await this.repo.update(existente.id, datos);
      return this.repo.findOneBy({ id: existente.id });
    }
    return this.repo.save(this.repo.create({ usuario: { id: usuarioId }, componente: { id: componenteId }, ...datos }));
  }

  listar(usuarioId: number) {
    return this.repo.find({ where: { usuario: { id: usuarioId } }, order: { disparada: 'DESC', fechaCreacion: 'DESC' } });
  }

  deUsuarioYComponente(usuarioId: number, componenteId: number) {
    return this.repo.findOne({ where: { usuario: { id: usuarioId }, componente: { id: componenteId } } });
  }

  async eliminar(id: number, usuarioId: number) {
    await this.repo.delete({ id, usuario: { id: usuarioId } });
  }

  contarSinVer(usuarioId: number) {
    return this.repo.count({ where: { usuario: { id: usuarioId }, disparada: true, vista: false } });
  }

  async marcarVistas(usuarioId: number) {
    await this.repo.update({ usuario: { id: usuarioId }, disparada: true, vista: false }, { vista: true });
  }

  contar() {
    return this.repo.count();
  }

  // Revisa todas las alertas pendientes contra los precios actuales
  async revisar(): Promise<number> {
    const pendientes = await this.repo.find({ where: { disparada: false } });
    if (!pendientes.length) return 0;
    const precios = await this.precios.mejoresPrecios(pendientes.map((a) => a.componente.id));
    let disparadas = 0;
    for (const a of pendientes) {
      const r = precios.get(a.componente.id);
      if (r?.mejor !== null && r?.mejor !== undefined && r.hayStock && r.mejor <= a.precioObjetivo) {
        await this.repo.update(a.id, { disparada: true, precioAlcanzado: r.mejor, fechaDisparo: new Date(), vista: false });
        disparadas++;
      }
    }
    if (disparadas) this.log.log(`${disparadas} alerta(s) de precio cumplida(s)`);
    return disparadas;
  }
}
