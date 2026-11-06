import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { Usuario } from '../usuarios/usuario.entity';

export const COOKIE_SESION = 'sesion';
export const DURACION_SESION_MS = 8 * 60 * 60 * 1000; // 8 horas

export interface DatosToken {
  sub: number;
  rol: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  // Crea el token y lo guarda en una cookie que JavaScript del navegador no puede leer
  iniciarSesion(res: Response, usuario: Usuario) {
    const token = this.jwt.sign({ sub: usuario.id, rol: usuario.rol } as DatosToken);
    res.cookie(COOKIE_SESION, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: DURACION_SESION_MS,
    });
  }

  cerrarSesion(res: Response) {
    res.clearCookie(COOKIE_SESION);
  }

  leerToken(token: string): DatosToken | null {
    try {
      return this.jwt.verify<DatosToken>(token);
    } catch {
      return null;
    }
  }
}
