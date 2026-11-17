import { tienePermiso } from '../usuarios/permisos';
import { randomBytes } from 'crypto';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Armado } from './armado.entity';
import { HistorialArmado } from './historial-armado.entity';
import { Accion, EDITABLES, ESTADOS, EstadoArmado, PENDIENTES_REVISION, TRANSICIONES } from './flujo-armado';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { Usuario } from '../usuarios/usuario.entity';
import { ConfiguradorService } from '../configurador/configurador.service';

@Injectable()
export class ArmadosService {
  constructor(
    @InjectRepository(Armado) private readonly repo: Repository<Armado>,
    @InjectRepository(HistorialArmado) private readonly historial: Repository<HistorialArmado>,
    private readonly configurador: ConfiguradorService,
    private readonly notificaciones: NotificacionesService,
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
    if (armado.usuario?.id !== usuario.id && !tienePermiso(usuario, 'armados.revisar')) {
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
    const armado = await this.propio(id, usuario);
    if (PENDIENTES_REVISION.includes(armado.estado as EstadoArmado) && armado.usuario?.id === usuario.id) {
      throw new BadRequestException('No puedes eliminar un armado mientras está en revisión');
    }
    await this.repo.delete(id);
  }

  // ---------- Flujo de revisión ----------

  historialDe(armadoId: number) {
    return this.historial.find({ where: { armado: { id: armadoId } }, order: { fecha: 'ASC', id: 'ASC' } });
  }

  // Bandeja del técnico: armados enviados o en revisión, los más antiguos primero
  pendientes() {
    return this.repo.find({ where: { estado: In(PENDIENTES_REVISION) }, order: { fechaEstado: 'ASC' } });
  }

  // Aplica una acción del flujo. Todas las reglas se comprueban aquí, en el servidor:
  // quién puede hacerla, desde qué estado, si exige motivo y si el armado es compatible.
  async aplicarAccion(id: number, usuario: Usuario, accion: Accion, comentario?: string) {
    const regla = TRANSICIONES[accion];
    const armado = await this.repo.findOne({ where: { id } });
    if (!armado) throw new NotFoundException('El armado no existe');

    const esDueno = armado.usuario?.id === usuario.id;
    if (regla.quien === 'dueno' && !esDueno) throw new ForbiddenException('Solo el dueño puede enviar su armado');
    if (regla.quien === 'revisor') {
      if (!tienePermiso(usuario, 'armados.revisar')) throw new ForbiddenException('Tu rol no puede revisar armados');
      if (esDueno) throw new ForbiddenException('No puedes revisar tu propio armado');
      if (accion !== 'tomar' && armado.revisor?.id !== usuario.id) throw new ForbiddenException('Este armado lo está revisando otro técnico');
    }
    const actual = armado.estado as EstadoArmado;
    if (!regla.desde.includes(actual)) {
      throw new BadRequestException(`No se puede ${accion} un armado en estado "${ESTADOS[actual] ?? actual}"`);
    }
    const texto = comentario?.trim() || null;
    if (regla.pideMotivo && (!texto || texto.length < 5)) throw new BadRequestException('Escribe el motivo (mínimo 5 caracteres)');

    // Regla del negocio: solo se revisan armados compatibles con los precios y reglas de hoy
    if (accion === 'enviar') {
      const r = await this.configurador.resumen(armado.componentes.map((c) => c.id));
      if (!r.compatibilidad.esCompatible) throw new BadRequestException('Corrige los problemas de compatibilidad antes de enviarlo');
      armado.esCompatible = true;
    }

    armado.estado = regla.hacia;
    armado.fechaEstado = new Date();
    if (accion === 'tomar') armado.revisor = usuario;
    if (regla.pideMotivo) armado.motivo = texto;
    if (accion === 'enviar' || accion === 'aprobar') armado.motivo = null;
    await this.repo.save(armado);
    await this.historial.save(this.historial.create({ armado, usuario, estadoAnterior: actual, estadoNuevo: regla.hacia, comentario: texto }));

    // Notificaciones en la campana
    const enlace = `/armado.html?id=${armado.id}`;
    if (accion === 'enviar') {
      await this.notificaciones.avisarAPermiso('armados.revisar', `Nuevo armado para revisar: "${armado.nombre}"`, enlace, usuario.id);
    } else if (armado.usuario) {
      const mensajes: Record<string, string> = {
        tomar: `Tu armado "${armado.nombre}" está en revisión`,
        aprobar: `Tu armado "${armado.nombre}" fue aprobado`,
        devolver: `Tu armado "${armado.nombre}" necesita cambios: ${texto}`,
        rechazar: `Tu armado "${armado.nombre}" fue rechazado: ${texto}`,
      };
      await this.notificaciones.avisar(armado.usuario.id, mensajes[accion], enlace);
    }
    return { estado: armado.estado, nombreEstado: ESTADOS[armado.estado as EstadoArmado] };
  }

  // El dueño cambia las piezas mientras el armado está en borrador o por corregir
  async actualizarPiezas(id: number, usuario: Usuario, ids: number[]) {
    const armado = await this.repo.findOne({ where: { id } });
    if (!armado) throw new NotFoundException('El armado no existe');
    if (armado.usuario?.id !== usuario.id) throw new ForbiddenException('Este armado pertenece a otro usuario');
    if (!EDITABLES.includes(armado.estado as EstadoArmado)) {
      throw new BadRequestException(`Un armado en estado "${ESTADOS[armado.estado as EstadoArmado]}" no se puede editar`);
    }
    if (!ids.length) throw new BadRequestException('Debes elegir al menos un componente');
    const resumen = await this.configurador.resumen(ids);
    armado.componentes = await this.configurador.cargarPiezas(ids);
    armado.precioTotal = resumen.total;
    armado.consumoTotal = resumen.consumo;
    armado.puntajeTotal = resumen.rendimiento.puntaje;
    armado.esCompatible = resumen.compatibilidad.esCompatible;
    await this.repo.save(armado);
    return { id: armado.id };
  }
}
