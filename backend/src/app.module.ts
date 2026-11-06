import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CategoriasModule } from './categorias/categorias.module';
import { ComponentesModule } from './componentes/componentes.module';
import { ReglasModule } from './reglas/reglas.module';
import { ArmadosModule } from './armados/armados.module';
import { SemillaModule } from './semilla/semilla.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { ProcesadoresModule } from './procesadores/procesadores.module';
import { ComunidadModule } from './comunidad/comunidad.module';
import { PreciosModule } from './precios/precios.module';
import { ProductosModule } from './productos/productos.module';
import { ConfiguradorModule } from './configurador/configurador.module';
import { PedidoModule } from './pedido/pedido.module';
import { ConfiguracionesModule } from './configuraciones/configuraciones.module';
import { GuiasModule } from './guias/guias.module';
import { HerramientasModule } from './herramientas/herramientas.module';
import { UsuarioActualMiddleware } from './auth/usuario-actual.middleware';
import { CuentaController } from './cuenta/cuenta.controller';
import { AdminController } from './admin/admin.controller';
import { InicioController } from './inicio.controller';

@Module({
  imports: [
    // MODELO: SQLite. Toda la base de datos es un archivo (backend/armadorpc.db)
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.BASE_DATOS || 'armadorpc.db',
      autoLoadEntities: true,
      synchronize: true, // crea y actualiza las tablas automáticamente (solo para desarrollo)
    }),
    ScheduleModule.forRoot(),
    UsuariosModule,
    AuthModule,
    CategoriasModule,
    ComponentesModule,
    ReglasModule,
    ComunidadModule,
    PreciosModule,
    ProcesadoresModule,
    ProductosModule,
    ConfiguradorModule,
    PedidoModule,
    ConfiguracionesModule,
    GuiasModule,
    HerramientasModule,
    ArmadosModule,
    SemillaModule,
  ],
  controllers: [InicioController, CuentaController, AdminController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UsuarioActualMiddleware).forRoutes('*');
  }
}
