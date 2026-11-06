import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Armado } from './armado.entity';
import { ArmadosService } from './armados.service';
import { ArmadosController, CompartidosController } from './armados.controller';
import { ConfiguradorModule } from '../configurador/configurador.module';

@Module({
  imports: [TypeOrmModule.forFeature([Armado]), ConfiguradorModule],
  providers: [ArmadosService],
  controllers: [ArmadosController, CompartidosController],
  exports: [ArmadosService],
})
export class ArmadosModule {}
