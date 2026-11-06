import { Body, Controller, Delete, HttpCode, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ComunidadService } from './comunidad.service';
import { ComponentesService } from '../componentes/componentes.service';
import { AutenticadoGuard, UsuarioActual } from '../auth/guardias';
import { Usuario } from '../usuarios/usuario.entity';

// Reseñas, reportes y comparaciones guardadas (requieren sesión)
@ApiTags('Comunidad')
@ApiCookieAuth('sesion')
@Controller('api')
@UseGuards(AutenticadoGuard)
export class ComunidadController {
  constructor(
    private readonly comunidad: ComunidadService,
    private readonly componentes: ComponentesService,
  ) {}

  @Post('componentes/:id/resenas')
  @ApiOperation({ summary: 'Crea o actualiza la reseña del usuario' })
  async resena(
    @Param('id', ParseIntPipe) id: number,
    @Body() cuerpo: { calificacion: number; comentario: string },
    @UsuarioActual() usuario: Usuario,
  ) {
    await this.componentes.obtener(id);
    await this.comunidad.guardarResena(usuario.id, id, Number(cuerpo.calificacion), cuerpo.comentario);
    return { ok: true, mensaje: '¡Gracias por tu reseña!' };
  }

  @Delete('resenas/:resenaId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Elimina una reseña propia (o cualquiera si es administrador)' })
  async eliminarResena(@Param('resenaId', ParseIntPipe) resenaId: number, @UsuarioActual() usuario: Usuario) {
    await this.comunidad.eliminarResena(resenaId, usuario.id, usuario.rol === 'admin');
  }

  @Post('componentes/:id/reportes')
  @ApiOperation({ summary: 'Reporta un dato incorrecto de un componente' })
  async reporte(@Param('id', ParseIntPipe) id: number, @Body('mensaje') mensaje: string, @UsuarioActual() usuario: Usuario) {
    await this.componentes.obtener(id);
    await this.comunidad.crearReporte(usuario.id, id, mensaje);
    return { ok: true, mensaje: 'Reporte enviado. Un administrador lo revisará.' };
  }

  @Post('comparaciones')
  @ApiOperation({ summary: 'Guarda una comparación de procesadores' })
  async guardarComparacion(@Body() cuerpo: { a: number; b: number }, @UsuarioActual() usuario: Usuario) {
    await this.componentes.obtener(Number(cuerpo.a));
    await this.componentes.obtener(Number(cuerpo.b));
    await this.comunidad.guardarComparacion(usuario.id, Number(cuerpo.a), Number(cuerpo.b));
    return { ok: true };
  }

  @Delete('comparaciones/:id')
  @HttpCode(204)
  async eliminarComparacion(@Param('id', ParseIntPipe) id: number, @UsuarioActual() usuario: Usuario) {
    await this.comunidad.eliminarComparacion(id, usuario.id);
  }
}
