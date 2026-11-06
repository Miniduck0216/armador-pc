import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol, Usuario } from '../usuarios/usuario.entity';

const CLAVE_ROLES = 'roles';

// Decorador para indicar qué roles pueden entrar: @Roles('admin')
export const Roles = (...roles: Rol[]) => SetMetadata(CLAVE_ROLES, roles);

// Decorador para recibir al usuario que ingresó: metodo(@UsuarioActual() u: Usuario)
export const UsuarioActual = createParamDecorator(
  (_dato: unknown, ctx: ExecutionContext): Usuario => ctx.switchToHttp().getRequest().usuario,
);

// Exige que haya una sesión iniciada
@Injectable()
export class AutenticadoGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    if (!ctx.switchToHttp().getRequest().usuario) {
      throw new UnauthorizedException('Debes iniciar sesión para continuar');
    }
    return true;
  }
}

// Exige un rol específico (se usa junto con AutenticadoGuard)
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Rol[]>(CLAVE_ROLES, [ctx.getHandler(), ctx.getClass()]);
    if (!roles?.length) return true;
    const usuario: Usuario = ctx.switchToHttp().getRequest().usuario;
    if (!usuario) throw new UnauthorizedException('Debes iniciar sesión para continuar');
    if (!roles.includes(usuario.rol)) {
      throw new ForbiddenException('No tienes permisos para ver esta sección');
    }
    return true;
  }
}
