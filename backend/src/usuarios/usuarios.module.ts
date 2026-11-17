import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './usuario.entity';
import { Rol } from './rol.entity';
import { Permiso } from './permiso.entity';
import { PermisoUsuario } from './permiso-usuario.entity';
import { UsuariosService } from './usuarios.service';
import { RolesService } from './roles.service';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Rol, Permiso, PermisoUsuario])],
  providers: [UsuariosService, RolesService],
  exports: [UsuariosService, RolesService, TypeOrmModule],
})
export class UsuariosModule {}
