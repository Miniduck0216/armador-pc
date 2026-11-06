// Catálogo de especificaciones de procesador. Es la ÚNICA fuente de verdad que usan
// la ficha de detalle, la tabla comparativa y las razones de "¿por qué es mejor?".
// Para comparar una característica nueva basta con agregarla aquí.

export type Sentido = 'mayor' | 'menor' | 'si' | 'texto';

export interface Definicion {
  clave: string;
  etiqueta: string;
  grupo: string;
  sentido: Sentido; // qué valor es mejor
  unidad?: string;
  decimales?: number;
  difMinima?: number; // diferencia mínima absoluta para contar como ventaja
  difRelativa?: number; // o diferencia mínima relativa (0.05 = 5 %)
  sinSeparador?: boolean; // años: 2025 y no 2.025
  ayuda?: string;
  razon?: (a: any, b: any) => string;
}

const pct = (a: number, b: number) => Math.round(((a - b) / b) * 100);
const coma = (v: number) => String(Math.round(v * 10) / 10).replace('.', ',');
const dif = (a: number, b: number, dec = 0) => Math.abs(a - b).toFixed(dec).replace('.', ',');

export const GRUPOS = ['Rendimiento', 'Pruebas de rendimiento', 'Memoria', 'Características', 'Precio'];

export const DEFINICIONES: Definicion[] = [
  // Rendimiento
  { clave: 'nucleos', etiqueta: 'Núcleos', grupo: 'Rendimiento', sentido: 'mayor', difMinima: 1,
    ayuda: 'Más núcleos permiten ejecutar más tareas a la vez.',
    razon: (a, b) => `Tiene ${dif(a, b)} núcleos más` },
  { clave: 'hilos', etiqueta: 'Hilos', grupo: 'Rendimiento', sentido: 'mayor', difMinima: 1,
    ayuda: 'Cantidad de tareas que el procesador maneja en paralelo.',
    razon: (a, b) => `Tiene ${dif(a, b)} hilos más` },
  { clave: 'frecuenciaBase', etiqueta: 'Frecuencia base', grupo: 'Rendimiento', sentido: 'mayor', unidad: 'GHz', decimales: 1, difMinima: 0.2,
    razon: (a, b) => `Frecuencia base ${dif(a, b, 1)} GHz más alta` },
  { clave: 'frecuenciaTurbo', etiqueta: 'Frecuencia turbo', grupo: 'Rendimiento', sentido: 'mayor', unidad: 'GHz', decimales: 1, difMinima: 0.2,
    ayuda: 'Velocidad máxima que alcanza un núcleo cuando hace falta potencia.',
    razon: (a, b) => `Frecuencia turbo ${dif(a, b, 1)} GHz más alta` },
  { clave: 'cacheL3', etiqueta: 'Caché L3', grupo: 'Rendimiento', sentido: 'mayor', unidad: 'MB', difMinima: 4,
    ayuda: 'Memoria muy rápida dentro del procesador; ayuda mucho en juegos.',
    razon: (a, b) => `${dif(a, b)} MB más de caché L3` },
  { clave: 'desbloqueado', etiqueta: 'Multiplicador desbloqueado', grupo: 'Rendimiento', sentido: 'si',
    razon: () => 'Permite hacer overclock' },

  // Pruebas
  { clave: 'cinebenchMono', etiqueta: 'Cinebench R23 (un núcleo)', grupo: 'Pruebas de rendimiento', sentido: 'mayor', difRelativa: 0.05,
    razon: (a, b) => `Rendimiento en un núcleo ${pct(a, b)} % superior` },
  { clave: 'cinebenchMulti', etiqueta: 'Cinebench R23 (multinúcleo)', grupo: 'Pruebas de rendimiento', sentido: 'mayor', difRelativa: 0.05,
    razon: (a, b) => `Rendimiento multinúcleo ${pct(a, b)} % superior` },

  // Memoria
  { clave: 'memoriaSoportada', etiqueta: 'Tipo de memoria', grupo: 'Memoria', sentido: 'texto' },
  { clave: 'velocidadMemoriaMax', etiqueta: 'Velocidad máxima de memoria', grupo: 'Memoria', sentido: 'mayor', unidad: 'MHz', difMinima: 200,
    razon: (a, b) => `Soporta memoria ${dif(a, b)} MHz más rápida` },

  // Características
  { clave: 'graficosIntegrados', etiqueta: 'Gráficos integrados', grupo: 'Características', sentido: 'si',
    ayuda: 'Permite usar la computadora sin tarjeta gráfica dedicada.',
    razon: () => 'Tiene gráficos integrados' },
  { clave: 'versionPcie', etiqueta: 'Versión de PCIe', grupo: 'Características', sentido: 'mayor', decimales: 1, difMinima: 1,
    razon: (a) => `Compatible con PCIe ${a},0` },
  { clave: 'tdp', etiqueta: 'Consumo (TDP)', grupo: 'Características', sentido: 'menor', unidad: 'W', difMinima: 10,
    ayuda: 'Energía que disipa el procesador; menos consumo implica menos calor.',
    razon: (a, b) => `Consume ${dif(a, b)} W menos` },
  { clave: 'litografia', etiqueta: 'Litografía', grupo: 'Características', sentido: 'menor', unidad: 'nm', difMinima: 1,
    razon: (a, b) => `Proceso de fabricación más fino (${coma(a)} nm frente a ${coma(b)} nm)` },
  { clave: 'anioLanzamiento', etiqueta: 'Año de lanzamiento', grupo: 'Características', sentido: 'mayor', difMinima: 1, sinSeparador: true,
    razon: (a, b) => `Es más reciente (${a} frente a ${b})` },

  // Precio
  { clave: 'precio', etiqueta: 'Precio de referencia', grupo: 'Precio', sentido: 'menor', unidad: '$', decimales: 2, difMinima: 10,
    razon: (a, b) => `Cuesta $${dif(a, b)} menos` },
  { clave: 'puntosPorDolar', etiqueta: 'Puntos por cada $100', grupo: 'Precio', sentido: 'mayor', decimales: 1, difRelativa: 0.1,
    razon: (a, b) => `Mejor relación rendimiento y precio (${pct(a, b)} % más puntos por dólar)` },
];

export function formatear(def: Definicion, valor: any): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (def.sentido === 'si') return valor ? 'Sí' : 'No';
  if (typeof valor !== 'number') return String(valor);
  if (def.sinSeparador) return String(Math.round(valor));
  const numero = valor.toLocaleString('es-EC', {
    minimumFractionDigits: def.decimales ?? 0,
    maximumFractionDigits: def.decimales ?? 0,
  });
  if (def.unidad === '$') return `$${numero}`;
  return def.unidad ? `${numero} ${def.unidad}` : numero;
}

// ¿El valor "a" es claramente mejor que "b" para esta especificación?
export function esMejor(def: Definicion, a: any, b: any): boolean {
  if (def.sentido === 'texto') return false;
  if (def.sentido === 'si') return !!a && !b;
  if (typeof a !== 'number' || typeof b !== 'number') return false;
  const diferencia = def.sentido === 'mayor' ? a - b : b - a;
  if (diferencia <= 0) return false;
  if (def.difRelativa) return diferencia / Math.abs(b || 1) >= def.difRelativa;
  return diferencia >= (def.difMinima ?? 0);
}
