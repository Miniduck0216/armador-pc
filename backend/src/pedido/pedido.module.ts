import { Module } from '@nestjs/common';
import { ConfiguradorModule } from '../configurador/configurador.module';
import { PreciosModule } from '../precios/precios.module';
import { PedidoController } from './pedido.controller';
import { PedidoService } from './pedido.service';

@Module({
  imports: [ConfiguradorModule, PreciosModule],
  providers: [PedidoService],
  controllers: [PedidoController],
})
export class PedidoModule {}
