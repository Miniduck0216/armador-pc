import { ProcesadorDto } from '../procesadores/dto/procesador.dto';

// Catálogo inicial de procesadores. Las especificaciones son de fabricante; los precios
// son referenciales en dólares y los puntajes de Cinebench R23 son aproximados.
type Fila = [
  nombre: string, marca: string, precio: number, zocalo: string,
  nucleos: number, hilos: number, base: number, turbo: number, cacheL3: number, tdp: number,
  litografia: number, anio: number, graficos: string | null, memoria: string, velocidadMemoria: number,
  pcie: number, desbloqueado: boolean, mono: number, multi: number,
];

const FILAS: Fila[] = [
  ['Core i3-12100F', 'Intel', 80, 'LGA1700', 4, 8, 3.3, 4.3, 12, 58, 10, 2022, null, 'DDR4/DDR5', 4800, 5, false, 1700, 8500],
  ['Core i5-12400F', 'Intel', 110, 'LGA1700', 6, 12, 2.5, 4.4, 18, 65, 10, 2022, null, 'DDR4/DDR5', 4800, 5, false, 1750, 12000],
  ['Core i5-13400F', 'Intel', 180, 'LGA1700', 10, 16, 2.5, 4.6, 20, 65, 10, 2023, null, 'DDR4/DDR5', 4800, 5, false, 1800, 16000],
  ['Core i5-14600K', 'Intel', 280, 'LGA1700', 14, 20, 3.5, 5.3, 24, 125, 10, 2023, 'Intel UHD 770', 'DDR4/DDR5', 5600, 5, true, 2100, 24000],
  ['Core i7-14700K', 'Intel', 380, 'LGA1700', 20, 28, 3.4, 5.6, 33, 125, 10, 2023, 'Intel UHD 770', 'DDR4/DDR5', 5600, 5, true, 2150, 35000],
  ['Core i9-14900K', 'Intel', 520, 'LGA1700', 24, 32, 3.2, 6.0, 36, 125, 10, 2023, 'Intel UHD 770', 'DDR4/DDR5', 5600, 5, true, 2300, 39000],
  ['Core Ultra 7 265K', 'Intel', 300, 'LGA1851', 20, 20, 3.9, 5.5, 30, 125, 3, 2024, 'Intel Graphics (4 núcleos Xe)', 'DDR5', 6400, 5, true, 2250, 36000],
  ['Core Ultra 9 285K', 'Intel', 590, 'LGA1851', 24, 24, 3.7, 5.7, 36, 125, 3, 2024, 'Intel Graphics (4 núcleos Xe)', 'DDR5', 6400, 5, true, 2350, 42000],
  ['Ryzen 5 5600GT', 'AMD', 140, 'AM4', 6, 12, 3.6, 4.6, 16, 65, 7, 2024, 'Radeon Graphics (7 núcleos)', 'DDR4', 3200, 3, true, 1450, 10500],
  ['Ryzen 7 5700X', 'AMD', 140, 'AM4', 8, 16, 3.4, 4.6, 32, 65, 7, 2022, null, 'DDR4', 3200, 4, true, 1530, 14000],
  ['Ryzen 5 8500G', 'AMD', 150, 'AM5', 6, 12, 3.5, 5.0, 16, 65, 4, 2024, 'Radeon 740M', 'DDR5', 5200, 4, true, 1750, 12500],
  ['Core i5-14400F', 'Intel', 200, 'LGA1700', 10, 16, 2.5, 4.7, 20, 65, 10, 2024, null, 'DDR4/DDR5', 4800, 5, false, 1850, 17000],
  ['Ryzen 5 5600', 'AMD', 110, 'AM4', 6, 12, 3.5, 4.4, 32, 65, 7, 2022, null, 'DDR4', 3200, 4, true, 1550, 11000],
  ['Ryzen 7 5700X3D', 'AMD', 200, 'AM4', 8, 16, 3.0, 4.1, 96, 105, 7, 2024, null, 'DDR4', 3200, 4, false, 1450, 13500],
  ['Ryzen 5 7600', 'AMD', 190, 'AM5', 6, 12, 3.8, 5.1, 32, 65, 5, 2023, 'Radeon Graphics (2 núcleos)', 'DDR5', 5200, 5, true, 1900, 15000],
  ['Ryzen 5 9600X', 'AMD', 230, 'AM5', 6, 12, 3.9, 5.4, 32, 65, 4, 2024, 'Radeon Graphics (2 núcleos)', 'DDR5', 5600, 5, true, 2150, 16800],
  ['Ryzen 7 7800X3D', 'AMD', 400, 'AM5', 8, 16, 4.2, 5.0, 96, 120, 5, 2023, 'Radeon Graphics (2 núcleos)', 'DDR5', 5200, 5, false, 1800, 18000],
  ['Ryzen 7 9800X3D', 'AMD', 480, 'AM5', 8, 16, 4.7, 5.2, 96, 120, 4, 2024, 'Radeon Graphics (2 núcleos)', 'DDR5', 5600, 5, true, 2050, 23000],
  ['Ryzen 9 9950X', 'AMD', 600, 'AM5', 16, 32, 4.3, 5.7, 64, 170, 4, 2024, 'Radeon Graphics (2 núcleos)', 'DDR5', 5600, 5, true, 2250, 42000],
  ['Ryzen 9 9950X3D', 'AMD', 700, 'AM5', 16, 32, 4.3, 5.7, 128, 170, 4, 2025, 'Radeon Graphics (2 núcleos)', 'DDR5', 5600, 5, true, 2200, 42500],
];

export const PROCESADORES: ProcesadorDto[] = FILAS.map(
  ([nombre, marca, precio, zocalo, nucleos, hilos, frecuenciaBase, frecuenciaTurbo, cacheL3, tdp, litografia,
    anioLanzamiento, graficos, memoriaSoportada, velocidadMemoriaMax, versionPcie, desbloqueado, cinebenchMono, cinebenchMulti]) => ({
    nombre, marca, precio, zocalo, nucleos, hilos, frecuenciaBase, frecuenciaTurbo, cacheL3, tdp, litografia,
    anioLanzamiento, graficosIntegrados: !!graficos, nombreGraficos: graficos ?? undefined, memoriaSoportada,
    velocidadMemoriaMax, versionPcie, desbloqueado, cinebenchMono, cinebenchMulti,
  }),
);
