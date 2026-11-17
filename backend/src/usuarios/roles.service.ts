import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { Rol } from './rol.entity';
import { Permiso } from './permiso.entity';
import { Usuario } from './usuario.entity';
import { PermisoUsuario } from './permiso-usuario.entity';
import { PERMISOS, ROLES_INICIALES, permisosDe } from './permisos';

@Injectable()
export class RolesService {
  private readonly log = new Logger('Roles');

  constructor(
    @InjectRepository(Rol) private readonly roles: Repository<Rol>,
    @InjectRepository(Permiso) private readonly permisos: Repository<Permiso>,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    @InjectRepository(PermisoUsuario) private readonly ajustes: Repository<PermisoUsuario>,
  ) {}

  // Se ejecuta al arrancar: crea los permisos y roles que falten y pasa a la tabla
  // de roles a los usuarios de bases antiguas (que guardaban el rol como texto).
  async asegurar() {
    for (const [codigo, nombre, modulo] of PERMISOS) {
      if (!(await this.permisos.findOneBy({ codigo }))) await this.permisos.save(this.permisos.create({ codigo, nombre, modulo }));
    }
    const todos = await this.permisos.find();
    for (const [codigo, nombre, descripcion, permisos] of ROLES_INICIALES) {
      const existente = await this.roles.findOneBy({ codigo });
      if (!existente) {
        await this.roles.save(this.roles.create({ codigo, nombre, descripcion, sistema: true, permisos: todos.filter((p) => permisos.includes(p.codigo)) }));
      } else if (codigo === 'admin') {
        // El administrador siempre tiene todos los permisos, incluidos los nuevos
        existente.permisos = todos;
        await this.roles.save(existente);
      }
    }
    const sinRol = await this.usuarios.createQueryBuilder('u').addSelect('u.rolAnterior').where('u.rolId IS NULL').getMany();
    for (const u of sinRol) {
      const rol = await this.roles.findOneBy({ codigo: u.rolAnterior === 'admin' ? 'admin' : 'usuario' });
      await this.usuarios.update(u.id, { rol });
    }
    if (sinRol.length) this.log.log(`${sinRol.length} usuario(s) pasaron a la tabla de roles`);
  }

  listar() {
    return this.roles.find({ order: { id: 'ASC' } });
  }

  catalogo() {
    return this.permisos.find({ order: { id: 'ASC' } });
  }

  async porCodigo(codigo: string) {
    const rol = await this.roles.findOneBy({ codigo });
    if (!rol) throw new NotFoundException(`No existe el rol ${codigo}`);
    return rol;
  }

  async porId(id: number) {
    const rol = await this.roles.findOneBy({ id });
    if (!rol) throw new NotFoundException('Ese rol no existe');
    return rol;
  }

  async usuariosPorRol(): Promise<Record<number, number>> {
    const filas = await this.usuarios.createQueryBuilder('u').select('u.rolId', 'rolId').addSelect('COUNT(*)', 'total').groupBy('u.rolId').getRawMany();
    return Object.fromEntries(filas.map((f) => [f.rolId, Number(f.total)]));
  }

  // Convierte códigos de permiso en entidades; rechaza códigos que no existen
  private async permisosValidos(codigos: string[]) {
    const lista = codigos.length ? await this.permisos.findBy({ codigo: In(codigos) }) : [];
    if (lista.length !== new Set(codigos).size) throw new BadRequestException('Hay permisos que no existen');
    return lista;
  }

  async crear(datos: { codigo: string; nombre: string; descripcion?: string; permisos: string[] }) {
    if (await this.roles.findOneBy({ codigo: datos.codigo })) throw new ConflictException('Ya existe un rol con ese código');
    const permisos = await this.permisosValidos(datos.permisos);
    return this.roles.save(this.roles.create({ codigo: datos.codigo, nombre: datos.nombre, descripcion: datos.descripcion ?? '', permisos }));
  }

  async actualizar(id: number, datos: { nombre?: string; descripcion?: string; permisos?: string[] }) {
    const rol = await this.porId(id);
    if (datos.permisos) {
      // El rol administrador no se puede recortar: así nunca se pierde el acceso al sistema
      if (rol.codigo === 'admin') throw new BadRequestException('Los permisos del Administrador no se pueden cambiar');
      rol.permisos = await this.permisosValidos(datos.permisos);
    }
    if (datos.nombre) rol.nombre = datos.nombre;
    if (datos.descripcion !== undefined) rol.descripcion = datos.descripcion;
    return this.roles.save(rol);
  }

  // ---------- Permisos por usuario ----------

  // Buscador del panel: por nombre o correo (máximo 20 resultados)
  buscarUsuarios(texto: string) {
    const t = `%${texto.trim().slice(0, 60)}%`;
    return this.usuarios.find({ where: [{ nombre: Like(t) }, { correo: Like(t) }], order: { nombre: 'ASC' }, take: 20 });
  }

  // Catálogo completo marcando, para esa persona, qué viene del rol y qué se ajustó
  async permisosDeUsuario(usuarioId: number) {
    const u = await this.usuarios.findOneBy({ id: usuarioId });
    if (!u) throw new NotFoundException('Ese usuario no existe');
    const delRol = new Set(u.rol?.permisos.map((p) => p.codigo) ?? []);
    const efectivos = new Set(permisosDe(u));
    const catalogo = await this.catalogo();
    return {
      usuario: { id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol?.nombre ?? 'Sin rol', esAdmin: u.rol?.codigo === 'admin' },
      permisos: catalogo.map((p) => ({
        codigo: p.codigo,
        nombre: p.nombre,
        modulo: p.modulo,
        delRol: delRol.has(p.codigo),
        efectivo: efectivos.has(p.codigo),
        ajuste: delRol.has(p.codigo) === efectivos.has(p.codigo) ? null : efectivos.has(p.codigo) ? 'agregado' : 'quitado',
      })),
    };
  }

  // Recibe la lista de permisos que la persona debe tener y guarda solo las diferencias con su rol
  async guardarPermisosDeUsuario(usuarioId: number, deseados: string[], quienEdita: Usuario) {
    if (usuarioId === quienEdita.id) throw new BadRequestException('No puedes cambiar tus propios permisos');
    const u = await this.usuarios.findOneBy({ id: usuarioId });
    if (!u) throw new NotFoundException('Ese usuario no existe');
    if (u.rol?.codigo === 'admin') throw new BadRequestException('Un Administrador siempre tiene todos los permisos');
    const validos = await this.permisosValidos(deseados);
    const quiere = new Set(validos.map((p) => p.codigo));
    const delRol = new Set(u.rol?.permisos.map((p) => p.codigo) ?? []);

    await this.ajustes.delete({ usuario: { id: u.id } });
    const catalogo = await this.catalogo();
    const nuevos = catalogo
      .filter((p) => quiere.has(p.codigo) !== delRol.has(p.codigo))
      .map((p) => this.ajustes.create({ usuario: u, permiso: p, concedido: quiere.has(p.codigo) }));
    if (nuevos.length) await this.ajustes.save(nuevos);
    return { agregados: nuevos.filter((n) => n.concedido).length, quitados: nuevos.filter((n) => !n.concedido).length };
  }

  async eliminar(id: number) {
    const rol = await this.porId(id);
    if (rol.sistema) throw new BadRequestException('Los roles del sistema no se pueden eliminar');
    if ((await this.usuarios.countBy({ rol: { id } })) > 0) throw new BadRequestException('Hay usuarios con este rol; cámbialos antes de eliminarlo');
    await this.roles.remove(rol);
  }
}
