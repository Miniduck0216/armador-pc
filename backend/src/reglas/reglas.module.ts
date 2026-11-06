import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReglaCompatibilidad } from './regla-compatibilidad.entity';
import { ReglasService } from './reglas.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReglaCompatibilidad])],
  providers: [ReglasService],

  exports: [ReglasService, TypeOrmModule],
})
export class ReglasModule {}
