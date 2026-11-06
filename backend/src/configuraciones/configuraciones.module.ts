import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Configuracion } from './configuracion.entity';
import { ConfiguracionesService } from './configuraciones.service';
import { ConfiguracionesController } from './configuraciones.controller';
import { ConfiguradorModule } from '../configurador/configurador.module';
import { ComponentesModule } from '../componentes/componentes.module';

@Module({
  imports: [TypeOrmModule.forFeature([Configuracion]), ConfiguradorModule, ComponentesModule],
  providers: [ConfiguracionesService],
  controllers: [ConfiguracionesController],
  exports: [ConfiguracionesService],
})
export class ConfiguracionesModule {}
