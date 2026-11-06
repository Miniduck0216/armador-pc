import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LimiteIntentosService } from './limite-intentos.service';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AutenticadoGuard, RolesGuard } from './guardias';
import { PreciosModule } from '../precios/precios.module';

const SECRETO = process.env.JWT_SECRETO || 'cambia-este-secreto-en-produccion';
if (!process.env.JWT_SECRETO) {
  // En producción no se permite el secreto por defecto: cualquiera que lo conozca podría firmar sesiones
  if (process.env.NODE_ENV === 'production') throw new Error('Define JWT_SECRETO antes de publicar el proyecto');
  console.warn('Aviso: usando el secreto de sesión por defecto. Define JWT_SECRETO para producción.');
}

@Module({
  imports: [
    UsuariosModule,
    PreciosModule,
    JwtModule.register({ secret: SECRETO, signOptions: { expiresIn: '8h' } }),
  ],
  providers: [AuthService, LimiteIntentosService, AutenticadoGuard, RolesGuard],
  controllers: [AuthController],
  exports: [AuthService, AutenticadoGuard, RolesGuard, UsuariosModule],
})
export class AuthModule {}
