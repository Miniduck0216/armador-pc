import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComparacionGuardada, Reporte, Resena } from './entidades';
import { ComunidadService } from './comunidad.service';
import { ComunidadController } from './comunidad.controller';
import { ComponentesModule } from '../componentes/componentes.module';

@Module({
  imports: [TypeOrmModule.forFeature([Resena, Reporte, ComparacionGuardada]), ComponentesModule],
  providers: [ComunidadService],
  controllers: [ComunidadController],
  exports: [ComunidadService],
})
export class ComunidadModule {}
