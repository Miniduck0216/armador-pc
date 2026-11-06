import { Module } from '@nestjs/common';
import { ConfiguradorService } from './configurador.service';
import { CompatibilidadService } from './compatibilidad.service';
import { RendimientoService } from './rendimiento.service';
import { ConfiguradorApiController } from './configurador-api.controller';
import { ComponentesModule } from '../componentes/componentes.module';
import { CategoriasModule } from '../categorias/categorias.module';
import { PreciosModule } from '../precios/precios.module';
import { ReglasModule } from '../reglas/reglas.module';

@Module({
  imports: [ComponentesModule, CategoriasModule, PreciosModule, ReglasModule],
  providers: [ConfiguradorService, CompatibilidadService, RendimientoService],
  controllers: [ConfiguradorApiController],
  exports: [ConfiguradorService],
})
export class ConfiguradorModule {}
