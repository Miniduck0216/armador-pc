import { Module } from '@nestjs/common';
import { SemillaService } from './semilla.service';
import { CategoriasModule } from '../categorias/categorias.module';
import { ComponentesModule } from '../componentes/componentes.module';
import { ReglasModule } from '../reglas/reglas.module';
import { ProcesadoresModule } from '../procesadores/procesadores.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { PreciosModule } from '../precios/precios.module';
import { ConfiguracionesModule } from '../configuraciones/configuraciones.module';
import { GuiasModule } from '../guias/guias.module';

@Module({
  imports: [CategoriasModule, ComponentesModule, ReglasModule, ProcesadoresModule, UsuariosModule, PreciosModule, ConfiguracionesModule, GuiasModule],
  providers: [SemillaService],
})
export class SemillaModule {}
