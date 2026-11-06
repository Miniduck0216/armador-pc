import { validacionApi } from '../comun/validacion-api.pipe';
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, Min } from 'class-validator';
import { PreciosService } from './precios.service';
import { AlertasService } from './alertas.service';
import { AutenticadoGuard, UsuarioActual } from '../auth/guardias';
import { Usuario } from '../usuarios/usuario.entity';

export class CrearAlertaDto {
  @ApiProperty({ example: 12, description: 'Id del componente' })
  @Type(() => Number) @IsInt() @Min(1)
  componenteId: number;

  @ApiProperty({ example: 499.99, description: 'Avisar cuando el mejor precio sea igual o menor a este valor' })
  @Type(() => Number) @IsNumber() @Min(1)
  precioObjetivo: number;
}

@ApiTags('Precios y alertas')
@Controller('api')
export class PreciosApiController {
  constructor(
    private readonly precios: PreciosService,
    private readonly alertas: AlertasService,
  ) {}

  @Get('tiendas')
  @ApiOperation({ summary: 'Tiendas con cantidad de ofertas y última actualización' })
  async tiendas() {
    return (await this.precios.estadisticasTiendas()).filter((t) => t.activa);
  }

  @Get('alertas')
  @UseGuards(AutenticadoGuard)
  @ApiCookieAuth('sesion')
  @ApiOperation({ summary: 'Alertas de precio del usuario' })
  async listar(@UsuarioActual() usuario: Usuario) {
    const lista = await this.alertas.listar(usuario.id);
    const precios = await this.precios.mejoresPrecios(lista.map((a) => a.componente.id));
    return lista.map((a) => ({ ...a, precioActual: precios.get(a.componente.id)?.mejor ?? null }));
  }

  @Post('alertas')
  @UseGuards(AutenticadoGuard)
  @ApiCookieAuth('sesion')
  @ApiOperation({ summary: 'Crea o actualiza una alerta de precio' })
  guardar(
    @Body(validacionApi) dto: CrearAlertaDto,
    @UsuarioActual() usuario: Usuario,
  ) {
    return this.alertas.guardar(usuario.id, dto.componenteId, dto.precioObjetivo);
  }

  @Delete('alertas/:id')
  @HttpCode(204)
  @UseGuards(AutenticadoGuard)
  @ApiCookieAuth('sesion')
  @ApiOperation({ summary: 'Elimina una alerta propia' })
  async eliminar(@Param('id', ParseIntPipe) id: number, @UsuarioActual() usuario: Usuario) {
    await this.alertas.eliminar(id, usuario.id);
  }
}
