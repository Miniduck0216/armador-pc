import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComparacionGuardada, Reporte, Resena } from './entidades';

@Injectable()
export class ComunidadService {
  constructor(
    @InjectRepository(Resena) private readonly resenas: Repository<Resena>,
    @InjectRepository(Reporte) private readonly reportes: Repository<Reporte>,
    @InjectRepository(ComparacionGuardada) private readonly comparaciones: Repository<ComparacionGuardada>,
  ) {}

  // ---- Reseñas ----
  resenasDe(componenteId: number) {
    return this.resenas.find({ where: { componente: { id: componenteId } }, order: { fecha: 'DESC' } });
  }

  resenasDeUsuario(usuarioId: number) {
    return this.resenas.find({
      where: { usuario: { id: usuarioId } },
      relations: { componente: true },
      order: { fecha: 'DESC' },
    });
  }

  // Promedio de estrellas de varios componentes a la vez
  async calificaciones(ids: number[]): Promise<Map<number, { promedio: number; total: number }>> {
    if (!ids.length) return new Map();
    const filas = await this.resenas
      .createQueryBuilder('r')
      .select('r.componenteId', 'cid')
      .addSelect('AVG(r.calificacion)', 'promedio')
      .addSelect('COUNT(*)', 'total')
      .where('r.componenteId IN (:...ids)', { ids })
      .groupBy('r.componenteId')
      .getRawMany();
    return new Map(filas.map((f) => [Number(f.cid), { promedio: Math.round(f.promedio * 10) / 10, total: Number(f.total) }]));
  }

  resumenCalificacion(lista: Resena[]) {
    if (!lista.length) return { promedio: 0, total: 0 };
    const promedio = lista.reduce((t, r) => t + r.calificacion, 0) / lista.length;
    return { promedio: Math.round(promedio * 10) / 10, total: lista.length };
  }

  // Crea la reseña o actualiza la existente del mismo usuario
  async guardarResena(usuarioId: number, componenteId: number, calificacion: number, comentario: string) {
    calificacion = Number(calificacion);
    comentario = (comentario ?? '').trim();
    if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
      throw new BadRequestException('La calificación debe ser de 1 a 5 estrellas');
    }
    if (comentario.length < 5 || comentario.length > 500) {
      throw new BadRequestException('El comentario debe tener entre 5 y 500 caracteres');
    }
    const existente = await this.resenas.findOne({ where: { usuario: { id: usuarioId }, componente: { id: componenteId } } });
    if (existente) {
      await this.resenas.update(existente.id, { calificacion, comentario });
      return;
    }
    await this.resenas.save(
      this.resenas.create({ usuario: { id: usuarioId }, componente: { id: componenteId }, calificacion, comentario }),
    );
  }

  async eliminarResena(id: number, usuarioId: number, esAdmin: boolean) {
    const resena = await this.resenas.findOne({ where: { id } });
    if (resena && (esAdmin || resena.usuario.id === usuarioId)) await this.resenas.delete(id);
  }

  contarResenas() {
    return this.resenas.count();
  }

  // ---- Reportes ----
  async crearReporte(usuarioId: number, componenteId: number, mensaje: string) {
    mensaje = (mensaje ?? '').trim();
    if (mensaje.length < 5 || mensaje.length > 300) {
      throw new BadRequestException('Describe el problema en 5 a 300 caracteres');
    }
    await this.reportes.save(this.reportes.create({ usuario: { id: usuarioId }, componente: { id: componenteId }, mensaje }));
  }

  listarReportes() {
    return this.reportes.find({ order: { estado: 'ASC', fecha: 'DESC' } });
  }

  contarReportesPendientes() {
    return this.reportes.count({ where: { estado: 'pendiente' } });
  }

  async resolverReporte(id: number) {
    await this.reportes.update(id, { estado: 'resuelto' });
  }

  // ---- Comparaciones guardadas ----
  async guardarComparacion(usuarioId: number, idA: number, idB: number) {
    const existe = await this.comparaciones.exist({
      where: { usuario: { id: usuarioId }, componenteA: { id: idA }, componenteB: { id: idB } },
    });
    if (!existe) {
      await this.comparaciones.save(
        this.comparaciones.create({ usuario: { id: usuarioId }, componenteA: { id: idA }, componenteB: { id: idB } }),
      );
    }
  }

  comparacionesDe(usuarioId: number) {
    return this.comparaciones.find({ where: { usuario: { id: usuarioId } }, order: { fecha: 'DESC' } });
  }

  async eliminarComparacion(id: number, usuarioId: number) {
    await this.comparaciones.delete({ id, usuario: { id: usuarioId } });
  }
}
