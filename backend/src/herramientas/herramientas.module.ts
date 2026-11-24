import { Module } from '@nestjs/common';
import { ComponentesModule } from '../componentes/componentes.module';
import { PreciosModule } from '../precios/precios.module';
import { HerramientasService } from './herramientas.service';
import { HerramientasController } from './herramientas.controller';

@Module({
  imports: [ComponentesModule, PreciosModule],
  providers: [HerramientasService],
  controllers: [HerramientasController],
})
export class HerramientasModule {}
