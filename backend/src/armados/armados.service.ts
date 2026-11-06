import { randomBytes } from 'crypto';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Armado } from './armado.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { ConfiguradorService } from '../configurador/configurador.service';

@Injectable()
export class ArmadosService {
  constructor(
    @InjectRepository(Armado) private readonly repo: Repository<Armado>,
    private readonly configurador: ConfiguradorService,
  ) {}

  async crear(usuario: Usuario, nombre: string, ids: number[]) {
    if (!ids.length) throw new BadRequestException('Debes elegir al menos un componente');
    const piezas = await this.configurador.cargarPiezas(ids);
    const resumen = await this.configurador.resumen(ids);

    // Se guardan los totales del momento: sirven para ver cómo cambió el precio después
    return this.repo.save(
      this.repo.create({
        nombre: nombre?.trim().slice(0, 60) || 'Mi armado',
        usuario,
        componentes: piezas,
        precioTotal: resumen.total,
        consumoTotal: resumen.consumo,
        puntajeTotal: resumen.rendimiento.puntaje,
        esCompatible: resumen.compatibilidad.esCompatible,
      }),
    );
  }

  // Solo el dueño (o un administrador) puede ver o borrar un armado
  private async propio(id: number, usuario: Usuario) {
    const armado = await this.repo.findOne({ where: { id } });
    if (!armado) throw new NotFoundException('El armado no existe');
    if (armado.usuario?.id !== usuario.id && usuario.rol !== 'admin') {
      throw new ForbiddenException('Este armado pertenece a otro usuario');
    }
    return armado;
  }

  async detalle(id: number, usuario: Usuario) {
    const armado = await this.propio(id, usuario);
    // Se recalcula con los precios y reglas actuales
    const resumen = await this.configurador.resumen(armado.componentes.map((c) => c.id));
    const diferencia = Math.round((resumen.total - armado.precioTotal) * 100) / 100;
    return { armado, resumen, diferencia };
  }

  async listarDe(usuarioId: number) {
    const armados = await this.repo.find({ where: { usuario: { id: usuarioId } }, order: { fechaCreacion: 'DESC' } });
    // Precio de hoy para cada armado
    for (const a of armados) {
      const r = await this.configurador.resumen(a.componentes.map((c) => c.id));
      (a as any).precioHoy = r.total;
      (a as any).diferencia = Math.round((r.total - a.precioTotal) * 100) / 100;
    }
    return armados;
  }

  // Genera (una sola vez) un enlace público para que cualquiera vea el armado
  async compartir(id: number, usuario: Usuario) {
    const armado = await this.propio(id, usuario);
    if (!armado.tokenPublico) {
      armado.tokenPublico = randomBytes(9).toString('base64url');
      await this.repo.save(armado);
    }
    return { token: armado.tokenPublico };
  }

  // Vista pública: sin datos del dueño, con precios y compatibilidad de hoy
  async publico(token: string) {
    if (!/^[A-Za-z0-9_-]{8,24}$/.test(token)) throw new NotFoundException('Este enlace no existe');
    const armado = await this.repo.findOne({ where: { tokenPublico: token } });
    if (!armado) throw new NotFoundException('Este enlace no existe o ya no está compartido');
    const resumen = await this.configurador.resumen(armado.componentes.map((c) => c.id));
    return {
      armado: { nombre: armado.nombre, fechaCreacion: armado.fechaCreacion, precioGuardado: armado.precioTotal },
      resumen,
      diferencia: Math.round((resumen.total - armado.precioTotal) * 100) / 100,
    };
  }

  contar() {
    return this.repo.count();
  }

  async eliminar(id: number, usuario: Usuario) {
    await this.propio(id, usuario);
    await this.repo.delete(id);
  }
}
