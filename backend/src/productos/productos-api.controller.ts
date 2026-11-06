import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { validacionApi } from '../comun/validacion-api.pipe';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import { PreciosService } from '../precios/precios.service';
import { FiltrosProductoDto } from './dto/filtros.dto';

// API pública del catálogo y de precios
@ApiTags('Catálogo')
@Controller('api')
export class ProductosApiController {
  constructor(
    private readonly productos: ProductosService,
    private readonly precios: PreciosService,
  ) {}

  @Get('categorias')
  @ApiOperation({ summary: 'Categorías con número de referencias, ofertas y precio mínimo' })
  categorias() {
    return this.productos.categoriasConConteo();
  }

  @Get('componentes')
  @ApiOperation({ summary: 'Catálogo filtrado, ordenado y paginado' })
  listar(@Query(validacionApi) filtros: FiltrosProductoDto) {
    return this.productos.listar(filtros);
  }

  @Get('componentes/:id')
  @ApiOperation({ summary: 'Ficha de un componente con sus ofertas' })
  detalle(@Param('id', ParseIntPipe) id: number) {
    return this.productos.detalle(id);
  }

  @Get('componentes/:id/ofertas')
  @ApiOperation({ summary: 'Precio en cada tienda, ordenado del más barato al más caro' })
  ofertas(@Param('id', ParseIntPipe) id: number) {
    return this.precios.ofertasDe(id);
  }

  @Get('componentes/:id/historial')
  @ApiOperation({ summary: 'Evolución del precio: mejor precio diario y una serie por tienda' })
  @ApiQuery({ name: 'dias', required: false, example: 90 })
  historial(@Param('id', ParseIntPipe) id: number, @Query('dias', new DefaultValuePipe(90), ParseIntPipe) dias: number) {
    return this.precios.historial(id, Math.min(Math.max(dias, 7), 365));
  }

  @Get('comparar-componentes')
  @ApiOperation({ summary: 'Compara de 2 a 3 componentes de la misma categoría' })
  @ApiQuery({ name: 'ids', example: '30,31,32' })
  comparar(@Query('ids') ids: string) {
    return this.productos.comparar(String(ids ?? '').split(',').map(Number).filter((n) => n > 0));
  }

  @Get('bajadas')
  @ApiOperation({ summary: 'Productos que más bajaron de precio en los últimos 7 días' })
  bajadas() {
    return this.productos.bajadas(12);
  }

  @Get('buscar')
  @ApiOperation({ summary: 'Búsqueda rápida para el buscador del encabezado' })
  @ApiQuery({ name: 'q', example: 'ryzen 7' })
  buscar(@Query('q') q: string) {
    return this.productos.buscar(q);
  }
}
