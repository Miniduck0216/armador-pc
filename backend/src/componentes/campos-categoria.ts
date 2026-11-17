// Campos técnicos que pide cada categoría. Es la ÚNICA definición: el formulario del panel
// la descarga para dibujar sus campos y el servidor la usa para validar que no falte ninguno.
// Son los datos que leen las reglas de compatibilidad del configurador.

export type TipoCampo = 'numero' | 'opcion' | 'opciones' | 'zocalo' | 'zocalos';

export interface Campo {
  campo: string; // columna de la tabla componentes
  etiqueta: string;
  tipo: TipoCampo;
  opciones?: string[]; // para opcion / opciones
  min?: number;
  max?: number;
}

const FORMATOS = ['ATX', 'mATX', 'ITX'];

export const CAMPOS_POR_CATEGORIA: Record<string, Campo[]> = {
  PLACA: [
    { campo: 'zocalo', etiqueta: 'Zócalo', tipo: 'zocalo' },
    { campo: 'tipoMemoria', etiqueta: 'Tipo de memoria', tipo: 'opcion', opciones: ['DDR4', 'DDR5'] },
    { campo: 'formato', etiqueta: 'Formato', tipo: 'opcion', opciones: FORMATOS },
  ],
  RAM: [{ campo: 'tipoMemoria', etiqueta: 'Tipo de memoria', tipo: 'opcion', opciones: ['DDR4', 'DDR5'] }],
  GPU: [{ campo: 'longitudMm', etiqueta: 'Largo de la tarjeta (mm)', tipo: 'numero', min: 100, max: 450 }],
  FUENTE: [{ campo: 'potenciaW', etiqueta: 'Potencia (W)', tipo: 'numero', min: 200, max: 2000 }],
  CAJA: [
    { campo: 'formatosSoportados', etiqueta: 'Formatos de placa que admite', tipo: 'opciones', opciones: FORMATOS },
    { campo: 'longitudMaxGpuMm', etiqueta: 'Largo máximo de tarjeta gráfica (mm)', tipo: 'numero', min: 150, max: 500 },
  ],
  REFRIG: [
    { campo: 'zocalosSoportados', etiqueta: 'Zócalos compatibles', tipo: 'zocalos' },
    { campo: 'capacidadTermicaW', etiqueta: 'Calor que puede disipar (W)', tipo: 'numero', min: 50, max: 500 },
  ],
};

// Todas las columnas técnicas posibles (las que no use la categoría se guardan vacías)
export const COLUMNAS_TECNICAS = ['zocalo', 'tipoMemoria', 'formato', 'longitudMm', 'potenciaW', 'formatosSoportados', 'longitudMaxGpuMm', 'zocalosSoportados', 'capacidadTermicaW'];

// Los procesadores tienen su propia sección con ficha técnica completa
export const CATEGORIAS_CON_SECCION_PROPIA = ['CPU'];
