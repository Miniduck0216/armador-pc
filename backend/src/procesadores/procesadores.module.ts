import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EspecificacionCpu } from './especificacion-cpu.entity';
import { ProcesadoresService } from './procesadores.service';
import { PuntajeService } from './puntaje.service';
import { ComparacionService } from './comparacion.service';
import { ProcesadoresController } from './procesadores.controller';
import { ProcesadoresApiController } from './procesadores-api.controller';
import { ComponentesModule } from '../componentes/componentes.module';
import { CategoriasModule } from '../categorias/categorias.module';
import { ComunidadModule } from '../comunidad/comunidad.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { PreciosModule } from '../precios/precios.module';

@Module({
  imports: [TypeOrmModule.forFeature([EspecificacionCpu]), ComponentesModule, CategoriasModule, ComunidadModule, UsuariosModule, PreciosModule],
  providers: [ProcesadoresService, PuntajeService, ComparacionService],
  controllers: [ProcesadoresController, ProcesadoresApiController],
  exports: [ProcesadoresService, TypeOrmModule],
})
export class ProcesadoresModule {}
