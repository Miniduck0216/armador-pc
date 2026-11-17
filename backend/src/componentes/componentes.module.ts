import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Componente } from './componente.entity';
import { Categoria } from '../categorias/categoria.entity';
import { ComponentesService } from './componentes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Componente, Categoria])],
  providers: [ComponentesService],
  exports: [ComponentesService, TypeOrmModule],
})
export class ComponentesModule {}
