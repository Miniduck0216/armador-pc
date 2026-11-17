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
import { Usuario } from '../usuarios/usuario.entity';
import { permisosDe } from '../usuarios/permisos';

const CLAVE_PERMISOS = 'permisos';

// Decorador para indicar qué permisos exige una ruta: @Permisos('precios.gestionar').
// Si se pone en la clase y en el método, se exigen los dos.
export const Permisos = (...codigos: string[]) => SetMetadata(CLAVE_PERMISOS, codigos);

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

// Exige que el rol del usuario tenga TODOS los permisos pedidos (se usa junto con AutenticadoGuard).
// Los permisos se leen de la base de datos en cada petición, así que un cambio de rol se aplica al instante.
@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const pedidos = this.reflector.getAllAndMerge<string[]>(CLAVE_PERMISOS, [ctx.getHandler(), ctx.getClass()]);
    if (!pedidos?.length) return true;
    const usuario: Usuario = ctx.switchToHttp().getRequest().usuario;
    if (!usuario) throw new UnauthorizedException('Debes iniciar sesión para continuar');
    const tiene = permisosDe(usuario);
    if (!pedidos.every((p) => tiene.includes(p))) {
      throw new ForbiddenException('Tu rol no tiene permiso para esta acción');
    }
    return true;
  }
}
