import { Module } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { ProductosApiController } from './productos-api.controller';
import { ComponentesModule } from '../componentes/componentes.module';
import { CategoriasModule } from '../categorias/categorias.module';
import { PreciosModule } from '../precios/precios.module';
import { ComunidadModule } from '../comunidad/comunidad.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [ComponentesModule, CategoriasModule, PreciosModule, ComunidadModule, UsuariosModule],
  providers: [ProductosService],
  controllers: [ProductosApiController],
  exports: [ProductosService],
})
export class ProductosModule {}
