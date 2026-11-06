import { Injectable } from '@nestjs/common';
import { EspecificacionCpu } from './especificacion-cpu.entity';

// Pesos del puntaje (suman 1). Cada especificación numérica se normaliza
// contra el mejor valor del catálogo, así que el puntaje es relativo, como en Versus.
const PESOS = {
  cinebenchMulti: 0.28,
  cinebenchMono: 0.22,
  frecuenciaTurbo: 0.1,
  cacheL3: 0.1,
  nucleos: 0.08,
  eficiencia: 0.07, // rendimiento multinúcleo por vatio
  hilos: 0.05,
  graficosIntegrados: 0.03,
  ddr5: 0.025,
  pcie5: 0.025,
  desbloqueado: 0.02,
};

export interface DesglosePuntaje {
  clave: string;
  etiqueta: string;
  peso: number;
  aporte: number; // puntos que aporta (0 a peso*100)
}

const ETIQUETAS: Record<keyof typeof PESOS, string> = {
  cinebenchMulti: 'Rendimiento multinúcleo',
  cinebenchMono: 'Rendimiento en un núcleo',
  frecuenciaTurbo: 'Frecuencia turbo',
  cacheL3: 'Caché L3',
  nucleos: 'Núcleos',
  eficiencia: 'Eficiencia energética',
  hilos: 'Hilos',
  graficosIntegrados: 'Gráficos integrados',
  ddr5: 'Soporte DDR5',
  pcie5: 'Soporte PCIe 5,0',
  desbloqueado: 'Overclock',
};

@Injectable()
export class PuntajeService {
  // Calcula el puntaje de todos los procesadores a la vez (necesita conocer los máximos)
  calcularTodos(especs: EspecificacionCpu[]): Map<number, { puntos: number; desglose: DesglosePuntaje[] }> {
    const max = (f: (e: EspecificacionCpu) => number) => Math.max(...especs.map(f), 1);
    const maximos = {
      cinebenchMulti: max((e) => e.cinebenchMulti),
      cinebenchMono: max((e) => e.cinebenchMono),
      frecuenciaTurbo: max((e) => e.frecuenciaTurbo),
      cacheL3: max((e) => e.cacheL3),
      nucleos: max((e) => e.nucleos),
      hilos: max((e) => e.hilos),
      eficiencia: max((e) => e.cinebenchMulti / e.tdp),
    };

    const resultado = new Map();
    for (const e of especs) {
      const normal: Record<keyof typeof PESOS, number> = {
        cinebenchMulti: e.cinebenchMulti / maximos.cinebenchMulti,
        cinebenchMono: e.cinebenchMono / maximos.cinebenchMono,
        frecuenciaTurbo: e.frecuenciaTurbo / maximos.frecuenciaTurbo,
        cacheL3: e.cacheL3 / maximos.cacheL3,
        nucleos: e.nucleos / maximos.nucleos,
        hilos: e.hilos / maximos.hilos,
        eficiencia: e.cinebenchMulti / e.tdp / maximos.eficiencia,
        graficosIntegrados: e.graficosIntegrados ? 1 : 0,
        ddr5: e.memoriaSoportada.includes('DDR5') ? 1 : 0,
        pcie5: e.versionPcie >= 5 ? 1 : 0,
        desbloqueado: e.desbloqueado ? 1 : 0,
      };

      const desglose = (Object.keys(PESOS) as (keyof typeof PESOS)[]).map((clave) => ({
        clave,
        etiqueta: ETIQUETAS[clave],
        peso: Math.round(PESOS[clave] * 100),
        aporte: Math.round(normal[clave] * PESOS[clave] * 1000) / 10,
      }));
      const puntos = Math.round(desglose.reduce((t, d) => t + d.aporte, 0));
      resultado.set(e.id, { puntos, desglose });
    }
    return resultado;
  }
}
