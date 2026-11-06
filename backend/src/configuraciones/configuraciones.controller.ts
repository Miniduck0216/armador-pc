import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ConfiguracionesService } from './configuraciones.service';
import { UsoConfiguracion } from './configuracion.entity';

@ApiTags('Configuraciones recomendadas')
@Controller('api/configuraciones')
export class ConfiguracionesController {
  constructor(private readonly configuraciones: ConfiguracionesService) {}

  @Get()
  @ApiOperation({ summary: 'Configuraciones recomendadas con su precio actual' })
  @ApiQuery({ name: 'uso', required: false, enum: ['gaming', 'creacion', 'trabajo'] })
  listar(@Query('uso') uso?: UsoConfiguracion) {
    const valido = ['gaming', 'creacion', 'trabajo'].includes(uso) ? uso : undefined;
    return this.configuraciones.listar(valido);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Una configuración con todas sus piezas' })
  obtener(@Param('slug') slug: string) {
    return this.configuraciones.obtener(slug);
  }
}
