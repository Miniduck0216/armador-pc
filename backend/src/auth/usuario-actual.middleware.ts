import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AuthService, COOKIE_SESION } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';

// Se ejecuta en cada petición: si la cookie de sesión es válida, deja al usuario
// en req.usuario para que lo usen los guardias y los controladores.
@Injectable()
export class UsuarioActualMiddleware implements NestMiddleware {
  constructor(
    private readonly auth: AuthService,
    private readonly usuarios: UsuariosService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.[COOKIE_SESION];
    const datos = token ? this.auth.leerToken(token) : null;
    if (datos) {
      const usuario = await this.usuarios.buscarPorId(datos.sub);
      if (usuario?.activo) req['usuario'] = usuario;
      else this.auth.cerrarSesion(res);
    }
    next();
  }
}
