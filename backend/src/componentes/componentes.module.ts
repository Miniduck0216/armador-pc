import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Componente } from './componente.entity';
import { ComponentesService } from './componentes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Componente])],
  providers: [ComponentesService],
  exports: [ComponentesService, TypeOrmModule],
})
export class ComponentesModule {}
