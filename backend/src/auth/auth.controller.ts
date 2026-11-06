import { BadRequestException, Body, Controller, Get, HttpCode, HttpException, HttpStatus, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LimiteIntentosService } from './limite-intentos.service';
import { IngresoDto, RegistroDto } from './dto/auth.dto';
import { validarFormulario } from '../comun/validar';
import { Usuario } from '../usuarios/usuario.entity';
import { AlertasService } from '../precios/alertas.service';

// Datos públicos del usuario (nunca se devuelve el resumen de la contraseña)
export const publico = (u: Usuario) => ({ id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol, esAdmin: u.rol === 'admin' });

@ApiTags('Autenticación')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly usuarios: UsuariosService,
    private readonly limite: LimiteIntentosService,
    private readonly alertas: AlertasService,
  ) {}

  @Get('yo')
  @ApiOperation({ summary: 'Usuario con sesión iniciada (o null)' })
  async yo(@Req() req: Request) {
    const u: Usuario = req['usuario'];
    if (!u) return { usuario: null };
    return { usuario: { ...publico(u), alertasNuevas: await this.alertas.contarSinVer(u.id) } };
  }

  @Post('ingresar')
  @HttpCode(200)
  @ApiOperation({ summary: 'Inicia sesión y deja la cookie "sesion"' })
  async ingresar(@Body() cuerpo: IngresoDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { dto, errores } = await validarFormulario(IngresoDto, cuerpo);
    if (errores.length) throw new BadRequestException(errores[0]);

    const ip = req.ip ?? 'desconocida';
    const minutos = this.limite.minutosRestantes(dto.correo, ip);
    if (minutos > 0) {
      throw new HttpException(`Demasiados intentos fallidos. Intenta de nuevo en ${minutos} minuto(s).`, HttpStatus.TOO_MANY_REQUESTS);
    }

    const usuario = await this.usuarios.verificarCredenciales(dto.correo, dto.contrasena);
    if (!usuario) {
      const quedan = this.limite.registrarFallo(dto.correo, ip);
      const aviso = quedan > 0 ? ` Te quedan ${quedan} intento(s).` : ' Tu ingreso quedó bloqueado por 5 minutos.';
      throw new UnauthorizedException('Correo o contraseña incorrectos.' + aviso);
    }
    this.limite.limpiar(dto.correo, ip);
    this.auth.iniciarSesion(res, usuario);
    return { usuario: publico(usuario) };
  }

  @Post('registro')
  @ApiOperation({ summary: 'Crea una cuenta e inicia sesión' })
  async registrar(@Body() cuerpo: RegistroDto, @Res({ passthrough: true }) res: Response) {
    const { dto, errores } = await validarFormulario(RegistroDto, cuerpo);
    if (!errores.length && dto.contrasena !== dto.confirmar) errores.push('Las contraseñas no coinciden');
    if (errores.length) throw new BadRequestException(errores[0]);
    const usuario = await this.usuarios.crear(dto.nombre, dto.correo, dto.contrasena);
    this.auth.iniciarSesion(res, usuario);
    return { usuario: publico(usuario) };
  }

  @Post('salir')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cierra la sesión' })
  salir(@Res({ passthrough: true }) res: Response) {
    this.auth.cerrarSesion(res);
    return { ok: true };
  }
}
