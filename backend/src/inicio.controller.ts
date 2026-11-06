import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductosService } from './productos/productos.service';
import { ProcesadoresService } from './procesadores/procesadores.service';
import { PreciosService } from './precios/precios.service';
import { MODO_PRECIOS } from './precios/tarea-precios.service';

// Datos de la portada en una sola petición
@ApiTags('Catálogo')
@Controller('api')
export class InicioController {
  constructor(
    private readonly productos: ProductosService,
    private readonly procesadores: ProcesadoresService,
    private readonly precios: PreciosService,
  ) {}

  @Get('inicio')
  @ApiOperation({ summary: 'Categorías, bajadas de precio, mejores procesadores y cifras para la portada' })
  async inicio() {
    const [categorias, bajadas, procesadores, tiendas] = await Promise.all([
      this.productos.categoriasConConteo(),
      this.productos.bajadas(8),
      this.procesadores.todos(),
      this.precios.estadisticasTiendas(),
    ]);
    const activas = tiendas.filter((t) => t.activa);
    return {
      modoPrecios: MODO_PRECIOS,
      categorias,
      bajadas,
      topProcesadores: procesadores.slice(0, 5).map(({ desglose: _d, ...p }) => p),
      tiendas: activas.filter((t) => t.ofertas > 0).map((t) => ({ nombre: t.nombre, color: t.color, sitioWeb: t.sitioWeb, ofertas: t.ofertas })),
      cifras: {
        tiendas: activas.filter((t) => t.ofertas > 0).length,
        referencias: categorias.reduce((t, c) => t + c.referencias, 0),
        ofertas: categorias.reduce((t, c) => t + c.ofertas, 0),
      },
    };
  }
}
