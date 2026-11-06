import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArmadosService } from './armados.service';
import { AutenticadoGuard, UsuarioActual } from '../auth/guardias';
import { Usuario } from '../usuarios/usuario.entity';
import { ConfiguradorService } from '../configurador/configurador.service';

// Armados guardados por cada usuario (zona protegida)
@ApiTags('Armados guardados')
@ApiCookieAuth('sesion')
@Controller('api/armados')
@UseGuards(AutenticadoGuard)
export class ArmadosController {
  constructor(private readonly armados: ArmadosService) {}

  @Get()
  @ApiOperation({ summary: 'Armados del usuario con su precio de hoy' })
  listar(@UsuarioActual() usuario: Usuario) {
    return this.armados.listarDe(usuario.id);
  }

  @Post()
  @ApiOperation({ summary: 'Guarda un armado: { nombre, piezas: [ids] }' })
  async crear(@Body() cuerpo: { nombre?: string; piezas?: number[] | string }, @UsuarioActual() usuario: Usuario) {
    const armado = await this.armados.crear(usuario, cuerpo.nombre, ConfiguradorService.ids(cuerpo.piezas));
    return { id: armado.id };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un armado con precios y compatibilidad actuales' })
  async detalle(@Param('id', ParseIntPipe) id: number, @UsuarioActual() usuario: Usuario) {
    const { armado, resumen, diferencia } = await this.armados.detalle(id, usuario);
    // Solo lo que necesita la vista (sin datos de la cuenta ni columnas internas)
    return {
      armado: {
        id: armado.id,
        nombre: armado.nombre,
        fechaCreacion: armado.fechaCreacion,
        precioTotal: armado.precioTotal,
        consumoTotal: armado.consumoTotal,
        puntajeTotal: armado.puntajeTotal,
        esCompatible: armado.esCompatible,
      },
      resumen,
      diferencia,
    };
  }

  @Post(':id/compartir')
  @HttpCode(200)
  @ApiOperation({ summary: 'Crea el enlace público del armado (o devuelve el que ya existe)' })
  compartir(@Param('id', ParseIntPipe) id: number, @UsuarioActual() usuario: Usuario) {
    return this.armados.compartir(id, usuario);
  }

  @Delete(':id')
  @HttpCode(204)
  async eliminar(@Param('id', ParseIntPipe) id: number, @UsuarioActual() usuario: Usuario) {
    await this.armados.eliminar(id, usuario);
  }
}

// Enlace público de un armado compartido (sin sesión)
@ApiTags('Armados compartidos')
@Controller('api/compartidos')
export class CompartidosController {
  constructor(private readonly armados: ArmadosService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Vista pública de un armado compartido' })
  publico(@Param('token') token: string) {
    return this.armados.publico(token);
  }
}
