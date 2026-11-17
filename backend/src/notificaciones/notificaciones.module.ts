import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notificacion } from './notificacion.entity';
import { NotificacionesService } from './notificaciones.service';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notificacion]), UsuariosModule],
  providers: [NotificacionesService],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
