import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { validacionApi } from '../comun/validacion-api.pipe';
import { HerramientasService } from './herramientas.service';
import { CalculoFuenteDto, CalculoRefrigeracionDto } from './herramientas.dto';

// Calculadoras de la página Herramientas
@ApiTags('Herramientas')
@Controller('api/herramientas')
export class HerramientasController {
  constructor(private readonly herramientas: HerramientasService) {}

  @Post('fuente')
  @HttpCode(200)
  @ApiOperation({ summary: 'Calculadora de fuente de poder: consumo estimado y potencia recomendada' })
  fuente(@Body(validacionApi) dto: CalculoFuenteDto) {
    return this.herramientas.fuente(dto);
  }

  @Post('refrigeracion')
  @HttpCode(200)
  @ApiOperation({ summary: 'Calculadora de refrigeración: calor a disipar y tipo de disipador recomendado' })
  refrigeracion(@Body(validacionApi) dto: CalculoRefrigeracionDto) {
    return this.herramientas.refrigeracion(dto);
  }
}
