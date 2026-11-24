import { BadRequestException, Body, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { UsuarioActual } from '../auth/guardias';
import { publico } from '../auth/auth.controller';
import { validarODetener } from '../comun/validar';
import { Usuario } from '../usuarios/usuario.entity';
import { UsuariosService } from '../usuarios/usuarios.service';
import { RolesService } from '../usuarios/roles.service';
import { UsuarioAdminDto } from './dto/usuario-admin.dto';
import { ZonaAdmin } from './zona-admin';

// Panel: cuentas de usuario (crear, cambiar su rol, activar o desactivar)
@ZonaAdmin('Usuarios', 'usuarios.gestionar')
export class UsuariosAdminController {
  constructor(
    private readonly usuarios: UsuariosService,
    private readonly roles: RolesService,
  ) {}

  @Get('usuarios')
  async lista(@UsuarioActual() actual: Usuario) {
    return (await this.usuarios.listar()).map((u) => ({
      ...publico(u),
      activo: u.activo,
      fechaRegistro: u.fechaRegistro,
      ultimoIngreso: u.ultimoIngreso,
      esYo: u.id === actual.id,
    }));
  }

  @Post('usuarios')
  @ApiOperation({ summary: 'Crea una cuenta con validación de correo, contraseña y rol en el servidor' })
  async crear(@Body() cuerpo: any) {
    const dto = await validarODetener(UsuarioAdminDto, cuerpo);
    const rol = await this.roles.porId(dto.rolId); // el rol tiene que existir en la tabla roles
    const creado = await this.usuarios.crear(dto.nombre, dto.correo, dto.contrasena, rol.codigo);
    return { id: creado.id };
  }

  @Patch('usuarios/:id')
  async cambiar(@Param('id', ParseIntPipe) id: number, @Body() cuerpo: { rolId?: number; activo?: boolean }, @UsuarioActual() actual: Usuario) {
    // Nadie puede modificarse a sí mismo (evita quedarse sin administradores)
    if (id === actual.id) throw new BadRequestException('No puedes cambiar tu propia cuenta');
    if (cuerpo.rolId !== undefined) {
      if (!Number.isInteger(cuerpo.rolId)) throw new BadRequestException('Elige un rol válido');
      await this.usuarios.cambiarRol(id, cuerpo.rolId);
    }
    if (typeof cuerpo.activo === 'boolean') await this.usuarios.cambiarEstado(id, cuerpo.activo);
    return { ok: true };
  }

  // Lista de roles para los desplegables (crear usuario y cambiar rol)
  @Get('roles-lista')
  async rolesLista() {
    return (await this.roles.listar()).map((r) => ({ id: r.id, codigo: r.codigo, nombre: r.nombre }));
  }
}
