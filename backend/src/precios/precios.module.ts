import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tienda } from './entidades/tienda.entity';
import { Oferta } from './entidades/oferta.entity';
import { HistorialPrecio } from './entidades/historial-precio.entity';
import { AlertaPrecio } from './entidades/alerta-precio.entity';
import { Componente } from '../componentes/componente.entity';
import { PreciosService } from './precios.service';
import { SimuladorPreciosService } from './simulador-precios.service';
import { AlertasService } from './alertas.service';
import { TareaPreciosService } from './tarea-precios.service';
import { SincronizadorService } from './sincronizador.service';
import { WooCommerceFuente } from './fuentes/woocommerce.fuente';
import { AliExpressFuente } from './fuentes/aliexpress.fuente';
import { MercadoLibreFuente } from './fuentes/mercadolibre.fuente';
import { PreciosApiController } from './precios-api.controller';
import { PROVEEDOR_PRECIOS } from './proveedor-precios';

@Module({
  imports: [TypeOrmModule.forFeature([Tienda, Oferta, HistorialPrecio, AlertaPrecio, Componente])],
  providers: [
    PreciosService,
    SimuladorPreciosService,
    AlertasService,
    TareaPreciosService,
    SincronizadorService,
    WooCommerceFuente,
    AliExpressFuente,
    MercadoLibreFuente,
    // Modo demostración: genera precios simulados para tiendas ficticias
    { provide: PROVEEDOR_PRECIOS, useExisting: SimuladorPreciosService },
  ],
  controllers: [PreciosApiController],
  exports: [PreciosService, AlertasService, TareaPreciosService, SincronizadorService, PROVEEDOR_PRECIOS, TypeOrmModule],
})
export class PreciosModule {}
