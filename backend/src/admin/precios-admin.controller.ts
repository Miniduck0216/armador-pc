import { BadRequestException, Body, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { validarODetener } from '../comun/validar';
import { PreciosService } from '../precios/precios.service';
import { TareaPreciosService } from '../precios/tarea-precios.service';
import { ComponentesService } from '../componentes/componentes.service';
import { OfertaAdminDto } from './dto/oferta-admin.dto';
import { ZonaAdmin } from './zona-admin';

// Panel: tiendas, actualización de precios y carga de un precio manual
@ZonaAdmin('Tiendas y precios', 'precios.gestionar')
export class PreciosAdminController {
  constructor(
    private readonly precios: PreciosService,
    private readonly tarea: TareaPreciosService,
    private readonly componentes: ComponentesService,
  ) {}

  @Get('precios')
  @ApiOperation({ summary: 'Tiendas, estado de la sincronización y modo de precios' })
  async panel() {
    return {
      estado: this.tarea.estado,
      tiendas: await this.precios.estadisticasTiendas(),
      ultimaActualizacion: await this.precios.ultimaActualizacion(),
      claves: { aliexpress: !!process.env.ALIEXPRESS_APP_KEY, mercadolibre: !!process.env.MERCADOLIBRE_CLIENT_ID },
    };
  }

  @Post('precios/actualizar')
  @ApiOperation({ summary: 'Lanza la actualización de precios en segundo plano' })
  actualizar() {
    if (this.tarea.estado.enCurso) return { mensaje: 'Ya hay una actualización en curso' };
    this.tarea.enSegundoPlano();
    return { mensaje: 'Actualización iniciada. Puede tardar unos minutos en las tiendas reales.' };
  }

  @Patch('tiendas/:id/alternar')
  async alternarTienda(@Param('id', ParseIntPipe) id: number) {
    await this.precios.alternarTienda(id);
    return { ok: true };
  }

  // Lista para el desplegable "Tienda" del formulario de precios
  @Get('tiendas')
  async tiendas() {
    return (await this.precios.listarTiendas()).map((t) => ({ id: t.id, nombre: t.nombre }));
  }

  // Componentes de UNA categoría: el desplegable "Componente" depende de "Categoría"
  @Get('componentes')
  async componentesDeCategoria(@Query('categoria') categoria?: string) {
    if (!categoria || !/^[A-Z]{2,10}$/.test(categoria)) throw new BadRequestException('Primero elige una categoría');
    return (await this.componentes.listar(categoria)).map((c) => ({ id: c.id, nombre: c.nombre, marca: c.marca }));
  }

  @Post('ofertas')
  @ApiOperation({ summary: 'Carga o actualiza el precio de un componente en una tienda' })
  async guardarOferta(@Body() cuerpo: any) {
    return { id: await this.precios.guardarOferta(await validarODetener(OfertaAdminDto, cuerpo)) };
  }
}
