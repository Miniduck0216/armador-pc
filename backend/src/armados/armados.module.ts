import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Armado } from './armado.entity';
import { HistorialArmado } from './historial-armado.entity';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { RevisionesController } from './revisiones.controller';
import { ArmadosService } from './armados.service';
import { ArmadosController, CompartidosController } from './armados.controller';
import { ConfiguradorModule } from '../configurador/configurador.module';

@Module({
  imports: [TypeOrmModule.forFeature([Armado, HistorialArmado]), ConfiguradorModule, NotificacionesModule],
  providers: [ArmadosService],
  controllers: [ArmadosController, CompartidosController, RevisionesController],
  exports: [ArmadosService],
})
export class ArmadosModule {}
