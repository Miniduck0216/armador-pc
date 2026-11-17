import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './notificacion.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { tienePermiso } from '../usuarios/permisos';

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Notificacion) private readonly repo: Repository<Notificacion>,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
  ) {}

  async avisar(usuarioId: number, mensaje: string, enlace = '') {
    await this.repo.save(this.repo.create({ usuario: { id: usuarioId } as Usuario, mensaje: mensaje.slice(0, 250), enlace }));
  }

  // Avisa a todas las cuentas activas cuyo rol tiene un permiso (por ejemplo, a los técnicos)
  async avisarAPermiso(codigoPermiso: string, mensaje: string, enlace = '', excepto?: number) {
    // Se usan los permisos efectivos: los del rol más los ajustes propios de cada persona
    const destino = (await this.usuarios.find({ where: { activo: true } })).filter((u) => tienePermiso(u, codigoPermiso));
    for (const u of destino) if (u.id !== excepto) await this.avisar(u.id, mensaje, enlace);
  }

  listar(usuarioId: number) {
    return this.repo.find({ where: { usuario: { id: usuarioId } }, order: { fecha: 'DESC', id: 'DESC' }, take: 30 });
  }

  contarSinVer(usuarioId: number) {
    return this.repo.count({ where: { usuario: { id: usuarioId }, vista: false } });
  }

  async marcarVistas(usuarioId: number) {
    await this.repo.update({ usuario: { id: usuarioId }, vista: false }, { vista: true });
  }
}
