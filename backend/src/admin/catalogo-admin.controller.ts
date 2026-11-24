import { BadRequestException, Body, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { validarODetener } from '../comun/validar';
import { ProcesadoresService } from '../procesadores/procesadores.service';
import { ProcesadorDto } from '../procesadores/dto/procesador.dto';
import { ComponentesService } from '../componentes/componentes.service';
import { ComponenteAdminDto } from '../componentes/dto/componente-admin.dto';
import { CAMPOS_POR_CATEGORIA, CATEGORIAS_CON_SECCION_PROPIA } from '../componentes/campos-categoria';
import { Componente } from '../componentes/componente.entity';
import { ZonaAdmin } from './zona-admin';

// Panel: CRUD de procesadores y del resto de componentes
@ZonaAdmin('Catálogo', 'componentes.gestionar')
export class CatalogoAdminController {
  constructor(
    private readonly procesadores: ProcesadoresService,
    private readonly componentes: ComponentesService,
  ) {}

  // ---- Procesadores (tienen su propia sección por la cantidad de datos) ----
  @Get('procesadores')
  async listaProcesadores() {
    return (await this.procesadores.todos()).map(({ desglose: _d, ...p }) => p);
  }

  @Post('procesadores')
  @ApiOperation({ summary: 'Crea un procesador (los puntajes se recalculan)' })
  async crearProcesador(@Body() cuerpo: any) {
    const creado = await this.procesadores.crear(await validarODetener(ProcesadorDto, cuerpo));
    return { id: creado.id };
  }

  @Put('procesadores/:id')
  async actualizarProcesador(@Param('id', ParseIntPipe) id: number, @Body() cuerpo: any) {
    await this.procesadores.actualizar(id, await validarODetener(ProcesadorDto, cuerpo));
    return { ok: true };
  }

  @Delete('procesadores/:id')
  @HttpCode(204)
  async eliminarProcesador(@Param('id', ParseIntPipe) id: number) {
    await this.procesadores.eliminar(id);
  }

  // ---- Componentes (todas las categorías salvo procesadores) ----
  // Categorías para el desplegable y qué campos técnicos pide cada una
  @Get('catalogo/campos')
  async campos() {
    const categorias = (await this.componentes.categoriasEditables()).map((c) => ({ id: c.id, codigo: c.codigo, nombre: c.nombre }));
    return { categorias, campos: CAMPOS_POR_CATEGORIA, zocalos: await this.componentes.zocalos() };
  }

  @Get('catalogo')
  async catalogo(@Query('categoria') categoria?: string) {
    if (categoria && !/^[A-Z]{2,10}$/.test(categoria)) throw new BadRequestException('Categoría no válida');
    const lista = (await this.componentes.listar(categoria || undefined)).filter((c) => !CATEGORIAS_CON_SECCION_PROPIA.includes(c.categoria.codigo));
    return lista.map((c: Componente) => ({
      id: c.id,
      nombre: c.nombre,
      marca: c.marca,
      precio: c.precio,
      consumoW: c.consumoW,
      puntajeRendimiento: c.puntajeRendimiento,
      busqueda: c.busqueda,
      categoria: { id: c.categoria.id, codigo: c.categoria.codigo, nombre: c.categoria.nombre },
      // Solo los datos técnicos que usa su categoría (zócalo, formato, potencia…)
      tecnicos: Object.fromEntries((CAMPOS_POR_CATEGORIA[c.categoria.codigo] ?? []).map((f) => [f.campo, c[f.campo]])),
    }));
  }

  @Post('catalogo')
  @ApiOperation({ summary: 'Crea un componente (categoría por desplegable, campos técnicos validados según la categoría)' })
  async crearComponente(@Body() cuerpo: any) {
    const c = await this.componentes.crear(await validarODetener(ComponenteAdminDto, cuerpo));
    return { id: c.id };
  }

  @Put('catalogo/:id')
  async editarComponente(@Param('id', ParseIntPipe) id: number, @Body() cuerpo: any) {
    await this.componentes.actualizar(id, await validarODetener(ComponenteAdminDto, cuerpo));
    return { id };
  }

  @Delete('catalogo/:id')
  @HttpCode(204)
  async eliminarComponente(@Param('id', ParseIntPipe) id: number) {
    await this.componentes.eliminar(id);
  }
}
