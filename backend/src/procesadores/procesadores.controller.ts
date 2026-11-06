import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProcesadoresService } from './procesadores.service';
import { ComparacionService } from './comparacion.service';
import { DEFINICIONES, GRUPOS, formatear } from './especificaciones';

// Análisis detallado de un procesador (puntaje, puntos a favor y en contra, ficha técnica)
@ApiTags('Procesadores')
@Controller('api/procesadores')
export class ProcesadoresController {
  constructor(
    private readonly procesadores: ProcesadoresService,
    private readonly comparacion: ComparacionService,
  ) {}

  @Get(':id/analisis')
  @ApiOperation({ summary: 'Puntaje, desglose, puntos a favor y en contra frente al promedio del catálogo' })
  async analisis(@Param('id', ParseIntPipe) id: number) {
    const p = await this.procesadores.obtener(id);
    const todos = await this.procesadores.todos();
    const promedio = await this.procesadores.promedio();

    return {
      procesador: p,
      total: todos.length,
      grupos: GRUPOS.map((g) => ({
        nombre: g,
        filas: DEFINICIONES.filter((d) => d.grupo === g).map((d) => ({ etiqueta: d.etiqueta, ayuda: d.ayuda, valor: formatear(d, p[d.clave]) })),
      })),
      aFavor: this.comparacion.razones(p, promedio),
      enContra: this.comparacion.enContra(p, promedio),
      similares: todos
        .filter((x) => x.id !== id)
        .sort((a, b) => Math.abs(a.puntos - p.puntos) - Math.abs(b.puntos - p.puntos))
        .slice(0, 4)
        .map(({ desglose: _d, ...x }) => x),
    };
  }
}
