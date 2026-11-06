import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Rol, Usuario } from './usuario.entity';
import { Componente } from '../componentes/componente.entity';

@Injectable()
export class UsuariosService {
  constructor(@InjectRepository(Usuario) private readonly repo: Repository<Usuario>) {}

  async crear(nombre: string, correo: string, contrasena: string, rol: Rol = 'usuario') {
    correo = correo.trim().toLowerCase();
    if (await this.repo.exist({ where: { correo } })) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }
    const contrasenaHash = await bcrypt.hash(contrasena, 10);
    return this.repo.save(this.repo.create({ nombre: nombre.trim(), correo, contrasenaHash, rol }));
  }

  // Devuelve el usuario solo si el correo y la contraseña coinciden
  async verificarCredenciales(correo: string, contrasena: string): Promise<Usuario | null> {
    const usuario = await this.repo
      .createQueryBuilder('u')
      .addSelect('u.contrasenaHash')
      .where('u.correo = :correo', { correo: correo.trim().toLowerCase() })
      .getOne();
    if (!usuario || !usuario.activo) return null;
    const valida = await bcrypt.compare(contrasena, usuario.contrasenaHash);
    if (!valida) return null;
    await this.repo.update(usuario.id, { ultimoIngreso: new Date() });
    return usuario;
  }

  buscarPorId(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  listar() {
    return this.repo.find({ order: { fechaRegistro: 'DESC' } });
  }

  contar() {
    return this.repo.count();
  }

  async cambiarRol(id: number, rol: Rol) {
    await this.repo.update(id, { rol });
  }

  async cambiarEstado(id: number, activo: boolean) {
    await this.repo.update(id, { activo });
  }

  // ---- Favoritos ----
  async favoritos(usuarioId: number): Promise<Componente[]> {
    const usuario = await this.repo.findOne({ where: { id: usuarioId }, relations: { favoritos: true } });
    if (!usuario) throw new NotFoundException();
    return usuario.favoritos;
  }

  async idsFavoritos(usuarioId: number): Promise<number[]> {
    return (await this.favoritos(usuarioId)).map((c) => c.id);
  }

  // Agrega o quita de favoritos; devuelve el nuevo estado
  async alternarFavorito(usuarioId: number, componenteId: number): Promise<boolean> {
    const relacion = this.repo.createQueryBuilder().relation(Usuario, 'favoritos').of(usuarioId);
    const ids = await this.idsFavoritos(usuarioId);
    if (ids.includes(componenteId)) {
      await relacion.remove(componenteId);
      return false;
    }
    await relacion.add(componenteId);
    return true;
  }
}
