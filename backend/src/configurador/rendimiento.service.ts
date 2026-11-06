import { Injectable } from '@nestjs/common';
import { Componente } from '../componentes/componente.entity';

export type Uso = 'juegos' | 'trabajo';

export interface ResultadoRendimiento {
  puntaje: number;
  nivel: string;
  descripcion: string;
  cuelloDeBotella: string | null;
}

// Peso de cada categoría en el puntaje final según el uso del equipo (suman 1)
export const PESOS: Record<Uso, Record<string, number>> = {
  juegos: { GPU: 0.65, CPU: 0.25, RAM: 0.1 }, // en juegos manda la gráfica
  trabajo: { CPU: 0.6, GPU: 0.25, RAM: 0.15 },
};

// Diferencia de puntaje a partir de la cual se considera cuello de botella
const UMBRAL_CUELLO = 30;

@Injectable()
export class RendimientoService {
  calcular(componentes: Componente[], uso: Uso = 'juegos'): ResultadoRendimiento {
    const porCategoria = new Map(componentes.map((c) => [c.categoria.codigo, c]));
    const puntaje = this.puntaje(porCategoria, uso);
    return { puntaje, ...this.nivel(puntaje), cuelloDeBotella: this.detectarCuello(porCategoria) };
  }

  puntaje(porCategoria: Map<string, Componente>, uso: Uso = 'juegos') {
    return Math.round(
      Object.entries(PESOS[uso]).reduce(
        (total, [codigo, peso]) => total + (porCategoria.get(codigo)?.puntajeRendimiento || 0) * peso,
        0,
      ),
    );
  }

  private nivel(puntaje: number) {
    if (puntaje >= 85) return { nivel: 'Entusiasta', descripcion: 'Juegos en 4K y ultra, transmisión y edición sin problemas' };
    if (puntaje >= 70) return { nivel: 'Alto', descripcion: 'Juegos en 1440p con calidad alta y buena tasa de cuadros' };
    if (puntaje >= 50) return { nivel: 'Medio', descripcion: 'Juegos en 1080p con calidad alta' };
    if (puntaje >= 30) return { nivel: 'Básico', descripcion: 'Juegos competitivos ligeros en 1080p y ofimática' };
    return { nivel: 'Oficina', descripcion: 'Tareas de oficina, navegación y estudio' };
  }

  detectarCuello(porCategoria: Map<string, Componente>): string | null {
    const cpu = porCategoria.get('CPU');
    const gpu = porCategoria.get('GPU');
    if (!cpu || !gpu) return null;

    const diferencia = gpu.puntajeRendimiento - cpu.puntajeRendimiento;
    if (diferencia > UMBRAL_CUELLO) {
      return `El procesador (${cpu.nombre}) limitará a la tarjeta gráfica (${gpu.nombre}). Considera un procesador más potente.`;
    }
    if (-diferencia > UMBRAL_CUELLO) {
      return `La tarjeta gráfica (${gpu.nombre}) se queda corta para el procesador (${cpu.nombre}). En juegos rendirías mejor con una gráfica superior.`;
    }
    return null;
  }
}
