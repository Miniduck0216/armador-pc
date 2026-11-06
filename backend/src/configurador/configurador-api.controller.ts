import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { validacionApi } from '../comun/validacion-api.pipe';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfiguradorService } from './configurador.service';
import { OpcionesDto, ResumenDto, SugerirDto } from './dto/configurador.dto';


// API del configurador: la usa el JavaScript de la página /configurador
@ApiTags('Configurador')
@Controller('api/configurador')
export class ConfiguradorApiController {
  constructor(private readonly configurador: ConfiguradorService) {}

  @Post('resumen')
  @HttpCode(200)
  @ApiOperation({ summary: 'Precio total, compatibilidad, rendimiento y advertencias de una selección' })
  resumen(@Body(validacionApi) dto: ResumenDto) {
    return this.configurador.resumen(ConfiguradorService.ids(dto.piezas), dto.uso);
  }

  @Get('opciones')
  @ApiOperation({ summary: 'Piezas de una categoría, marcando cuáles encajan con lo ya elegido' })
  opciones(@Query(validacionApi) dto: OpcionesDto) {
    return this.configurador.opciones(dto.categoria, ConfiguradorService.ids(dto.piezas), dto.buscar, dto.orden);
  }

  @Get('sugerir')
  @ApiOperation({ summary: 'Arma automáticamente el mejor equipo para un presupuesto' })
  sugerir(@Query(validacionApi) dto: SugerirDto) {
    return this.configurador.sugerir(dto.presupuesto, dto.uso, { sinGrafica: dto.sinGrafica });
  }
}
