import { Injectable } from '@nestjs/common';
import { DEFINICIONES, GRUPOS, esMejor, formatear } from './especificaciones';
import { ProcesadorVista } from './procesadores.service';

export interface Razon {
  texto: string;
  valor: string; // "16 frente a 8"
}

export interface FilaComparacion {
  etiqueta: string;
  ayuda?: string;
  valorA: string;
  valorB: string;
  ganador: 'a' | 'b' | null;
  barraA: number; // 0 a 100, para dibujar barras
  barraB: number;
}

@Injectable()
export class ComparacionService {
  // Lista de razones por las que "a" es mejor que "b" (estilo "¿Por qué X es mejor que Y?")
  razones(a: Record<string, any>, b: Record<string, any>): Razon[] {
    return DEFINICIONES.filter((d) => d.razon && esMejor(d, a[d.clave], b[d.clave])).map((d) => ({
      texto: d.razon(a[d.clave], b[d.clave]),
      valor: d.sentido === 'si' ? '' : `${formatear(d, a[d.clave])} frente a ${formatear(d, b[d.clave])}`,
    }));
  }

  // Puntos en contra de un procesador frente al promedio del catálogo
  enContra(p: Record<string, any>, promedio: Record<string, any>): Razon[] {
    return DEFINICIONES.filter((d) => d.sentido !== 'si' && esMejor(d, promedio[d.clave], p[d.clave])).map((d) => ({
      texto: `${d.etiqueta} por debajo del promedio`,
      valor: `${formatear(d, p[d.clave])} frente a ${formatear(d, promedio[d.clave])}`,
    }));
  }

  comparar(a: ProcesadorVista, b: ProcesadorVista) {
    const grupos = GRUPOS.map((grupo) => ({
      nombre: grupo,
      filas: DEFINICIONES.filter((d) => d.grupo === grupo).map((d): FilaComparacion => {
        const va = a[d.clave];
        const vb = b[d.clave];
        const ganador = esMejor(d, va, vb) ? 'a' : esMejor(d, vb, va) ? 'b' : null;
        const [barraA, barraB] = this.barras(d.sentido, va, vb);
        return { etiqueta: d.etiqueta, ayuda: d.ayuda, valorA: formatear(d, va), valorB: formatear(d, vb), ganador, barraA, barraB };
      }),
    }));

    const victoriasA = grupos.flatMap((g) => g.filas).filter((f) => f.ganador === 'a').length;
    const victoriasB = grupos.flatMap((g) => g.filas).filter((f) => f.ganador === 'b').length;

    return {
      a,
      b,
      razonesA: this.razones(a, b),
      razonesB: this.razones(b, a),
      grupos,
      victoriasA,
      victoriasB,
      ganador: a.puntos === b.puntos ? null : a.puntos > b.puntos ? 'a' : 'b',
      diferenciaPuntos: Math.abs(a.puntos - b.puntos),
    };
  }

  // Tamaño relativo de cada barra (el mejor valor ocupa el 100 %)
  private barras(sentido: string, a: any, b: any): [number, number] {
    if (typeof a !== 'number' || typeof b !== 'number') {
      if (sentido === 'si') return [a ? 100 : 0, b ? 100 : 0];
      return [0, 0];
    }
    if (sentido === 'menor') {
      const min = Math.min(a, b);
      return [Math.round((min / a) * 100), Math.round((min / b) * 100)];
    }
    const max = Math.max(a, b) || 1;
    return [Math.round((a / max) * 100), Math.round((b / max) * 100)];
  }
}
