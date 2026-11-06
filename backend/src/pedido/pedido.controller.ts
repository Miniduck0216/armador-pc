import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ConfiguradorService } from '../configurador/configurador.service';
import { PedidoService } from './pedido.service';

// Lista de compra: dónde comprar cada pieza y cuánto cuesta el pedido (público)
@ApiTags('Lista de compra')
@Controller('api/pedido')
export class PedidoController {
  constructor(private readonly pedido: PedidoService) {}

  @Get()
  @ApiQuery({ name: 'ids', example: '12,40,71', description: 'Ids de las piezas separados por coma' })
  @ApiOperation({ summary: 'Mejor forma de comprar un armado: por tienda o todo en una sola' })
  calcular(@Query('ids') ids?: string) {
    const lista = ConfiguradorService.ids(ids);
    if (!lista.length) throw new BadRequestException('Indica al menos una pieza en ids');
    return this.pedido.calcular(lista);
  }
}
