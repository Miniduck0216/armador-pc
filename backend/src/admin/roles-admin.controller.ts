import { Body, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { UsuarioActual } from '../auth/guardias';
import { validarODetener } from '../comun/validar';
import { Usuario } from '../usuarios/usuario.entity';
import { RolesService } from '../usuarios/roles.service';
import { RolAdminDto, RolPermisosDto } from './dto/rol-admin.dto';
import { ZonaAdmin } from './zona-admin';

// Panel: roles con sus permisos y permisos de cada persona
@ZonaAdmin('Roles y permisos', 'roles.gestionar')
export class RolesAdminController {
  constructor(private readonly roles: RolesService) {}

  @Get('roles')
  @ApiOperation({ summary: 'Roles con sus permisos y el catálogo de permisos' })
  async detalle() {
    const [roles, permisos, conteo] = await Promise.all([this.roles.listar(), this.roles.catalogo(), this.roles.usuariosPorRol()]);
    return {
      permisos: permisos.map((p) => ({ codigo: p.codigo, nombre: p.nombre, modulo: p.modulo })),
      roles: roles.map((r) => ({
        id: r.id,
        codigo: r.codigo,
        nombre: r.nombre,
        descripcion: r.descripcion,
        sistema: r.sistema,
        bloqueado: r.codigo === 'admin', // el Administrador siempre tiene todo
        usuarios: conteo[r.id] ?? 0,
        permisos: r.permisos.map((p) => p.codigo),
      })),
    };
  }

  @Post('roles')
  async crear(@Body() cuerpo: any) {
    const rol = await this.roles.crear(await validarODetener(RolAdminDto, cuerpo));
    return { id: rol.id };
  }

  @Put('roles/:id/permisos')
  async cambiarPermisos(@Param('id', ParseIntPipe) id: number, @Body() cuerpo: any) {
    const dto = await validarODetener(RolPermisosDto, cuerpo);
    await this.roles.actualizar(id, { permisos: dto.permisos });
    return { ok: true };
  }

  @Delete('roles/:id')
  @HttpCode(204)
  async eliminar(@Param('id', ParseIntPipe) id: number) {
    await this.roles.eliminar(id);
  }

  // ---- Permisos de una persona (además de los de su rol) ----
  @Get('permisos-usuarios')
  @ApiOperation({ summary: 'Busca usuarios por nombre o correo para ajustar sus permisos' })
  async buscar(@Query('buscar') buscar = '') {
    return (await this.roles.buscarUsuarios(buscar)).map((u) => ({ id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol?.nombre ?? 'Sin rol' }));
  }

  @Get('permisos-usuarios/:id')
  deUsuario(@Param('id', ParseIntPipe) id: number) {
    return this.roles.permisosDeUsuario(id);
  }

  @Put('permisos-usuarios/:id')
  async guardarDeUsuario(@Param('id', ParseIntPipe) id: number, @Body() cuerpo: any, @UsuarioActual() actual: Usuario) {
    const dto = await validarODetener(RolPermisosDto, cuerpo);
    return this.roles.guardarPermisosDeUsuario(id, dto.permisos, actual);
  }
}
