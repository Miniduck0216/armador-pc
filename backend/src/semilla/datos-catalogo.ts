import { Componente } from '../componentes/componente.entity';
import { Categoria } from '../categorias/categoria.entity';
import { ReglaCompatibilidad } from '../reglas/regla-compatibilidad.entity';
import { Tienda } from '../precios/entidades/tienda.entity';

// ---------------------------------------------------------------------------
// Datos iniciales del catálogo. Precios de referencia en dólares y valores
// técnicos aproximados (las longitudes de tarjetas gráficas varían por modelo).
// Las tiendas son FICTICIAS: sus dominios .example no existen.
// ---------------------------------------------------------------------------

export const CATEGORIAS: Partial<Categoria>[] = [
  { codigo: 'CPU', nombre: 'Procesador', plural: 'Procesadores', icono: 'cpu', orden: 1,
    descripcion: 'El cerebro del equipo: define la velocidad en juegos, edición y multitarea.',
    queMirar: 'Primero núcleos, hilos y rendimiento por núcleo; después frecuencias, consumo, caché, zócalo y generación.' },
  { codigo: 'PLACA', nombre: 'Placa madre', plural: 'Placas madre', icono: 'placa', orden: 2,
    descripcion: 'Conecta todas las piezas; determina el zócalo, la memoria y el tamaño del equipo.',
    queMirar: 'Primero zócalo y chipset; después memoria compatible, ranuras M.2 y PCIe, WiFi y conectividad.' },
  { codigo: 'REFRIG', nombre: 'Refrigeración', plural: 'Refrigeración', icono: 'refrig', orden: 3, obligatoria: false,
    descripcion: 'Disipadores de aire y refrigeración líquida para mantener el procesador fresco.',
    queMirar: 'Primero capacidad de disipación y zócalos compatibles; después ruido, altura y espacio en la caja.' },
  { codigo: 'RAM', nombre: 'Memoria RAM', plural: 'Memorias RAM', icono: 'ram', orden: 4,
    descripcion: 'Memoria de trabajo: 16 GB es el mínimo para jugar, 32 GB es lo recomendado.',
    queMirar: 'Primero capacidad, tipo (DDR4 o DDR5) y velocidad; después latencia, número de módulos y RGB.' },
  { codigo: 'GPU', nombre: 'Tarjeta gráfica', plural: 'Tarjetas gráficas', icono: 'gpu', orden: 5,
    descripcion: 'La pieza más importante para jugar: define resolución y cuadros por segundo.',
    queMirar: 'Primero rendimiento real y memoria de video; después consumo, largo de la tarjeta y tecnologías (DLSS/FSR).' },
  { codigo: 'ALMAC', nombre: 'Almacenamiento', plural: 'Almacenamiento', icono: 'ssd', orden: 6,
    descripcion: 'Unidades SSD NVMe y SATA para el sistema, los juegos y tus archivos.',
    queMirar: 'Primero capacidad y velocidad de lectura; después interfaz (PCIe 4.0/5.0 o SATA) y garantía.' },
  { codigo: 'FUENTE', nombre: 'Fuente de poder', plural: 'Fuentes de poder', icono: 'fuente', orden: 7,
    descripcion: 'Entrega energía estable a todo el equipo; nunca conviene ahorrar aquí.',
    queMirar: 'Primero potencia y certificación 80 Plus; después modularidad, conectores y norma ATX 3.0.' },
  { codigo: 'CAJA', nombre: 'Caja', plural: 'Cajas', icono: 'caja', orden: 8, obligatoria: false,
    descripcion: 'Gabinete que protege las piezas, organiza los cables y mueve el aire.',
    queMirar: 'Primero formato de placa y espacio para la tarjeta gráfica; después flujo de aire y ventiladores incluidos.' },
  { codigo: 'MONITOR', nombre: 'Monitor', plural: 'Monitores', icono: 'monitor', orden: 9, obligatoria: false, grupo: 'periferico',
    descripcion: 'Resolución, tasa de refresco y panel: lo que ves de todo tu equipo.',
    queMirar: 'Primero resolución y frecuencia (Hz); después tipo de panel, tamaño y tiempo de respuesta.' },
  { codigo: 'RATON', nombre: 'Ratón', plural: 'Ratones', icono: 'raton', orden: 10, obligatoria: false, grupo: 'periferico',
    descripcion: 'Sensor, peso y forma para jugar y trabajar con precisión.',
    queMirar: 'Primero sensor y peso; después conexión (cable o inalámbrico), forma y botones.' },
  { codigo: 'TECLADO', nombre: 'Teclado', plural: 'Teclados', icono: 'teclado', orden: 11, obligatoria: false, grupo: 'periferico',
    descripcion: 'Mecánicos o de membrana, completos o compactos.',
    queMirar: 'Primero tipo de interruptor y formato (completo o TKL); después conexión e iluminación.' },
  { codigo: 'ALTAVOZ', nombre: 'Sistema de altavoces', plural: 'Altavoces', icono: 'altavoz', orden: 12, obligatoria: false, grupo: 'periferico',
    descripcion: 'Parlantes para escritorio, con o sin subwoofer.',
    queMirar: 'Primero potencia y si incluye subwoofer; después conexión (USB, 3,5 mm, Bluetooth).' },
];

// Tiendas REALES de Ecuador con catálogo público por API de WooCommerce
// (se comprobó que responden en /wp-json/wc/store/v1/products), más AliExpress y
// Mercado Libre Ecuador, que necesitan claves propias. Las "simuladas" son ficticias
// y solo se usan en modo demostración (PRECIOS_MODO=demo).
export const TIENDAS: Partial<Tienda>[] = [
  { nombre: 'Computron', sitioWeb: 'https://www.computron.com.ec', fuente: 'woocommerce', ciudad: 'Guayaquil', color: '#e3262f', costoEnvio: 0, diasEntrega: 3, valoracion: 4.3 },
  { nombre: 'Tecnosmart', sitioWeb: 'https://www.tecnosmart.com.ec', fuente: 'woocommerce', ciudad: 'Quito', color: '#1f6feb', costoEnvio: 0, diasEntrega: 3, valoracion: 4.4 },
  { nombre: 'MTEC', sitioWeb: 'https://mtec-ec.com', fuente: 'woocommerce', ciudad: 'Quito', color: '#7c3aed', costoEnvio: 0, diasEntrega: 3, valoracion: 4.4 },
  { nombre: 'NomadaWare', sitioWeb: 'https://nomadaware.com.ec', fuente: 'woocommerce', ciudad: 'Ecuador', color: '#e6007e', costoEnvio: 0, diasEntrega: 3, valoracion: 4.3 },
  { nombre: 'Neutron PC Gamer', sitioWeb: 'https://neutronpcgamer.com', fuente: 'woocommerce', ciudad: 'Ecuador', color: '#0ea5a4', costoEnvio: 0, diasEntrega: 3, valoracion: 4.3 },
  { nombre: 'AliExpress', sitioWeb: 'https://es.aliexpress.com', fuente: 'aliexpress', pais: 'China (envío a Ecuador)', color: '#ff4747', costoEnvio: 0, diasEntrega: 20, valoracion: 4.0 },
  { nombre: 'Mercado Libre Ecuador', sitioWeb: 'https://www.mercadolibre.com.ec', fuente: 'mercadolibre', color: '#ffe600', costoEnvio: 0, diasEntrega: 4, valoracion: 4.2 },
  // Ficticias (modo demo)
  { nombre: 'TecnoMundo (demo)', sitioWeb: 'https://tecnomundo.example', fuente: 'simulada', color: '#22c55e', costoEnvio: 0, diasEntrega: 2, valoracion: 4.6 },
  { nombre: 'GamerZone (demo)', sitioWeb: 'https://gamerzone.example', fuente: 'simulada', color: '#ec4899', costoEnvio: 4.99, diasEntrega: 1, valoracion: 4.4 },
  { nombre: 'ByteShop (demo)', sitioWeb: 'https://byteshop.example', fuente: 'simulada', color: '#0ea5e9', costoEnvio: 5.99, diasEntrega: 3, valoracion: 4.2 },
  { nombre: 'MegaPC (demo)', sitioWeb: 'https://megapc.example', fuente: 'simulada', color: '#f59e0b', costoEnvio: 0, diasEntrega: 4, valoracion: 4.0 },
  { nombre: 'PixelStore (demo)', sitioWeb: 'https://pixelstore.example', fuente: 'simulada', color: '#8b5cf6', costoEnvio: 3.5, diasEntrega: 2, valoracion: 4.5 },
];

type Dato = Partial<Componente> & { cat: string };

const TODOS_ZOCALOS = 'AM4,AM5,LGA1700,LGA1851';

export const COMPONENTES: Dato[] = [
  // ---- Refrigeración ----
  { cat: 'REFRIG', nombre: 'Wraith Stealth', marca: 'AMD', precio: 15, consumoW: 2, zocalosSoportados: 'AM4,AM5', capacidadTermicaW: 65,
    atributos: { Tipo: 'Aire (perfil bajo)', Ventilador: '92 mm', Ruido: 'Medio' } },
  { cat: 'REFRIG', nombre: 'AK400', marca: 'DeepCool', precio: 35, consumoW: 3, zocalosSoportados: TODOS_ZOCALOS, capacidadTermicaW: 180,
    atributos: { Tipo: 'Aire (torre)', Ventilador: '120 mm', Altura: '155 mm' } },
  { cat: 'REFRIG', nombre: 'Peerless Assassin 120 SE', marca: 'Thermalright', precio: 40, consumoW: 4, zocalosSoportados: TODOS_ZOCALOS, capacidadTermicaW: 240,
    atributos: { Tipo: 'Aire (doble torre)', Ventilador: '2 × 120 mm', Altura: '155 mm' } },
  { cat: 'REFRIG', nombre: 'NH-D15 G2', marca: 'Noctua', precio: 150, consumoW: 4, zocalosSoportados: TODOS_ZOCALOS, capacidadTermicaW: 280,
    atributos: { Tipo: 'Aire (doble torre)', Ventilador: '2 × 140 mm', Altura: '168 mm', Ruido: 'Muy bajo' } },
  { cat: 'REFRIG', nombre: 'Liquid Freezer III 240', marca: 'Arctic', precio: 90, consumoW: 8, zocalosSoportados: TODOS_ZOCALOS, capacidadTermicaW: 280,
    atributos: { Tipo: 'Líquida (AIO)', Radiador: '240 mm' } },
  { cat: 'REFRIG', nombre: 'Kraken 360', marca: 'NZXT', precio: 180, consumoW: 10, zocalosSoportados: TODOS_ZOCALOS, capacidadTermicaW: 330,
    atributos: { Tipo: 'Líquida (AIO)', Radiador: '360 mm', Extra: 'Pantalla LCD' } },

  // ---- Placas madre ----
  { cat: 'PLACA', nombre: 'A520M-A Pro', marca: 'MSI', precio: 80, consumoW: 35, zocalo: 'AM4', tipoMemoria: 'DDR4', formato: 'mATX',
    atributos: { Chipset: 'A520', 'Ranuras RAM': '2', 'Ranuras M.2': '1', WiFi: 'No' } },
  { cat: 'PLACA', nombre: 'B550 Tomahawk', marca: 'MSI', precio: 150, consumoW: 45, zocalo: 'AM4', tipoMemoria: 'DDR4', formato: 'ATX',
    atributos: { Chipset: 'B550', 'Ranuras RAM': '4', 'Ranuras M.2': '2', WiFi: 'No' } },
  { cat: 'PLACA', nombre: 'PRO B760M-A DDR4', marca: 'MSI', precio: 130, consumoW: 45, zocalo: 'LGA1700', tipoMemoria: 'DDR4', formato: 'mATX',
    atributos: { Chipset: 'B760', 'Ranuras RAM': '4', 'Ranuras M.2': '2', WiFi: 'Sí' } },
  { cat: 'PLACA', nombre: 'ROG Strix Z790-E', marca: 'ASUS', precio: 400, consumoW: 65, zocalo: 'LGA1700', tipoMemoria: 'DDR5', formato: 'ATX',
    atributos: { Chipset: 'Z790', 'Ranuras RAM': '4', 'Ranuras M.2': '5', WiFi: 'Wi-Fi 6E', Overclock: 'Sí' } },
  { cat: 'PLACA', nombre: 'TUF Gaming Z890-Plus', marca: 'ASUS', precio: 300, consumoW: 60, zocalo: 'LGA1851', tipoMemoria: 'DDR5', formato: 'ATX',
    atributos: { Chipset: 'Z890', 'Ranuras RAM': '4', 'Ranuras M.2': '4', WiFi: 'Wi-Fi 7', Overclock: 'Sí' } },
  { cat: 'PLACA', nombre: 'PRO B650M-A WiFi', marca: 'MSI', precio: 150, consumoW: 45, zocalo: 'AM5', tipoMemoria: 'DDR5', formato: 'mATX',
    atributos: { Chipset: 'B650', 'Ranuras RAM': '4', 'Ranuras M.2': '2', WiFi: 'Wi-Fi 6E' } },
  { cat: 'PLACA', nombre: 'TUF Gaming B650-Plus', marca: 'ASUS', precio: 190, consumoW: 50, zocalo: 'AM5', tipoMemoria: 'DDR5', formato: 'ATX',
    atributos: { Chipset: 'B650', 'Ranuras RAM': '4', 'Ranuras M.2': '2', WiFi: 'No' } },
  { cat: 'PLACA', nombre: 'ROG Strix B650E-I', marca: 'ASUS', precio: 290, consumoW: 45, zocalo: 'AM5', tipoMemoria: 'DDR5', formato: 'ITX',
    atributos: { Chipset: 'B650E', 'Ranuras RAM': '2', 'Ranuras M.2': '2', WiFi: 'Wi-Fi 6E' } },
  { cat: 'PLACA', nombre: 'X870 Aorus Elite', marca: 'Gigabyte', precio: 280, consumoW: 60, zocalo: 'AM5', tipoMemoria: 'DDR5', formato: 'ATX',
    atributos: { Chipset: 'X870', 'Ranuras RAM': '4', 'Ranuras M.2': '4', WiFi: 'Wi-Fi 7', Overclock: 'Sí' } },

  // ---- Memorias RAM ----
  { cat: 'RAM', nombre: 'Fury Beast 16 GB DDR4 3200', marca: 'Kingston', precio: 40, consumoW: 6, puntajeRendimiento: 40, tipoMemoria: 'DDR4',
    atributos: { Capacidad: '16 GB (2 × 8)', Velocidad: '3200 MHz', Latencia: 'CL16' } },
  { cat: 'RAM', nombre: 'Vengeance 32 GB DDR4 3600', marca: 'Corsair', precio: 70, consumoW: 8, puntajeRendimiento: 55, tipoMemoria: 'DDR4',
    atributos: { Capacidad: '32 GB (2 × 16)', Velocidad: '3600 MHz', Latencia: 'CL18' } },
  { cat: 'RAM', nombre: 'Vengeance 16 GB DDR5 5600', marca: 'Corsair', precio: 60, consumoW: 8, puntajeRendimiento: 58, tipoMemoria: 'DDR5',
    atributos: { Capacidad: '16 GB (2 × 8)', Velocidad: '5600 MHz', Latencia: 'CL36' } },
  { cat: 'RAM', nombre: 'Fury Beast 32 GB DDR5 6000', marca: 'Kingston', precio: 100, consumoW: 10, puntajeRendimiento: 75, tipoMemoria: 'DDR5',
    atributos: { Capacidad: '32 GB (2 × 16)', Velocidad: '6000 MHz', Latencia: 'CL30' } },
  { cat: 'RAM', nombre: 'Trident Z5 64 GB DDR5 6400', marca: 'G.Skill', precio: 210, consumoW: 14, puntajeRendimiento: 95, tipoMemoria: 'DDR5',
    atributos: { Capacidad: '64 GB (2 × 32)', Velocidad: '6400 MHz', Latencia: 'CL32', RGB: 'Sí' } },

  // ---- Tarjetas gráficas ----
  { cat: 'GPU', nombre: 'GeForce GTX 1650', marca: 'NVIDIA', precio: 160, consumoW: 75, puntajeRendimiento: 20, longitudMm: 180,
    atributos: { Memoria: '4 GB GDDR6', 'Resolución ideal': '1080p (bajo)', 'Trazado de rayos': 'No' } },
  { cat: 'GPU', nombre: 'Radeon RX 7600', marca: 'AMD', precio: 260, consumoW: 165, puntajeRendimiento: 44, longitudMm: 250,
    atributos: { Memoria: '8 GB GDDR6', 'Resolución ideal': '1080p', 'Trazado de rayos': 'Sí' } },
  { cat: 'GPU', nombre: 'GeForce RTX 4060', marca: 'NVIDIA', precio: 300, consumoW: 115, puntajeRendimiento: 50, longitudMm: 245,
    atributos: { Memoria: '8 GB GDDR6', 'Resolución ideal': '1080p', 'Trazado de rayos': 'Sí', DLSS: '3' } },
  { cat: 'GPU', nombre: 'GeForce RTX 5060 Ti 16 GB', marca: 'NVIDIA', precio: 430, consumoW: 180, puntajeRendimiento: 60, longitudMm: 270,
    atributos: { Memoria: '16 GB GDDR7', 'Resolución ideal': '1080p / 1440p', 'Trazado de rayos': 'Sí', DLSS: '4' } },
  { cat: 'GPU', nombre: 'Radeon RX 7700 XT', marca: 'AMD', precio: 420, consumoW: 245, puntajeRendimiento: 64, longitudMm: 280,
    atributos: { Memoria: '12 GB GDDR6', 'Resolución ideal': '1440p', 'Trazado de rayos': 'Sí' } },
  { cat: 'GPU', nombre: 'GeForce RTX 5070', marca: 'NVIDIA', precio: 550, consumoW: 250, puntajeRendimiento: 76, longitudMm: 300,
    atributos: { Memoria: '12 GB GDDR7', 'Resolución ideal': '1440p', 'Trazado de rayos': 'Sí', DLSS: '4' } },
  { cat: 'GPU', nombre: 'Radeon RX 9070 XT', marca: 'AMD', precio: 600, consumoW: 304, puntajeRendimiento: 84, longitudMm: 330,
    atributos: { Memoria: '16 GB GDDR6', 'Resolución ideal': '1440p / 4K', 'Trazado de rayos': 'Sí', FSR: '4' } },
  { cat: 'GPU', nombre: 'GeForce RTX 5070 Ti', marca: 'NVIDIA', precio: 750, consumoW: 300, puntajeRendimiento: 86, longitudMm: 330,
    atributos: { Memoria: '16 GB GDDR7', 'Resolución ideal': '1440p / 4K', 'Trazado de rayos': 'Sí', DLSS: '4' } },
  { cat: 'GPU', nombre: 'Radeon RX 7900 XTX', marca: 'AMD', precio: 900, consumoW: 355, puntajeRendimiento: 88, longitudMm: 330,
    atributos: { Memoria: '24 GB GDDR6', 'Resolución ideal': '4K', 'Trazado de rayos': 'Sí' } },
  { cat: 'GPU', nombre: 'GeForce RTX 5080', marca: 'NVIDIA', precio: 1000, consumoW: 360, puntajeRendimiento: 92, longitudMm: 340,
    atributos: { Memoria: '16 GB GDDR7', 'Resolución ideal': '4K', 'Trazado de rayos': 'Sí', DLSS: '4' } },
  { cat: 'GPU', nombre: 'GeForce RTX 5090', marca: 'NVIDIA', precio: 2000, consumoW: 575, puntajeRendimiento: 100, longitudMm: 357,
    atributos: { Memoria: '32 GB GDDR7', 'Resolución ideal': '4K (ultra)', 'Trazado de rayos': 'Sí', DLSS: '4' } },

  // ---- Almacenamiento ----
  { cat: 'ALMAC', nombre: 'MX500 1 TB', marca: 'Crucial', precio: 65, consumoW: 4,
    atributos: { Capacidad: '1 TB', Interfaz: 'SATA III', Lectura: '560 MB/s' } },
  { cat: 'ALMAC', nombre: 'NV2 1 TB', marca: 'Kingston', precio: 60, consumoW: 5,
    atributos: { Capacidad: '1 TB', Interfaz: 'NVMe PCIe 4.0', Lectura: '3500 MB/s' } },
  { cat: 'ALMAC', nombre: 'P3 Plus 2 TB', marca: 'Crucial', precio: 115, consumoW: 6,
    atributos: { Capacidad: '2 TB', Interfaz: 'NVMe PCIe 4.0', Lectura: '5000 MB/s' } },
  { cat: 'ALMAC', nombre: 'WD Black SN850X 1 TB', marca: 'Western Digital', precio: 90, consumoW: 7,
    atributos: { Capacidad: '1 TB', Interfaz: 'NVMe PCIe 4.0', Lectura: '7300 MB/s' } },
  { cat: 'ALMAC', nombre: '990 Pro 2 TB', marca: 'Samsung', precio: 170, consumoW: 8,
    atributos: { Capacidad: '2 TB', Interfaz: 'NVMe PCIe 4.0', Lectura: '7450 MB/s' } },
  { cat: 'ALMAC', nombre: 'T700 2 TB', marca: 'Crucial', precio: 230, consumoW: 10,
    atributos: { Capacidad: '2 TB', Interfaz: 'NVMe PCIe 5.0', Lectura: '12400 MB/s' } },

  // ---- Fuentes de poder ----
  { cat: 'FUENTE', nombre: '500 W1', marca: 'EVGA', precio: 50, potenciaW: 500, atributos: { Certificación: '80 Plus White', Modular: 'No' } },
  { cat: 'FUENTE', nombre: 'CX650M', marca: 'Corsair', precio: 75, potenciaW: 650, atributos: { Certificación: '80 Plus Bronze', Modular: 'Semi' } },
  { cat: 'FUENTE', nombre: 'MAG A750GL', marca: 'MSI', precio: 95, potenciaW: 750, atributos: { Certificación: '80 Plus Gold', Modular: 'Sí', 'ATX 3.0': 'Sí' } },
  { cat: 'FUENTE', nombre: 'RM850x', marca: 'Corsair', precio: 130, potenciaW: 850, atributos: { Certificación: '80 Plus Gold', Modular: 'Sí', 'ATX 3.0': 'Sí' } },
  { cat: 'FUENTE', nombre: 'Focus GX-1000', marca: 'Seasonic', precio: 180, potenciaW: 1000, atributos: { Certificación: '80 Plus Gold', Modular: 'Sí', 'ATX 3.0': 'Sí' } },
  { cat: 'FUENTE', nombre: 'HX1500i', marca: 'Corsair', precio: 350, potenciaW: 1500, atributos: { Certificación: '80 Plus Platinum', Modular: 'Sí', 'ATX 3.1': 'Sí' } },

  // ---- Cajas ----
  { cat: 'CAJA', nombre: 'Versa H18', marca: 'Thermaltake', precio: 45, consumoW: 3, formatosSoportados: 'mATX,ITX', longitudMaxGpuMm: 350,
    atributos: { Formato: 'Minitorre', Ventiladores: '1 incluido' } },
  { cat: 'CAJA', nombre: 'Air 100 ARGB', marca: 'Montech', precio: 60, consumoW: 6, formatosSoportados: 'mATX,ITX', longitudMaxGpuMm: 330,
    atributos: { Formato: 'Minitorre', Ventiladores: '4 incluidos', RGB: 'Sí' } },
  { cat: 'CAJA', nombre: 'NR200P', marca: 'Cooler Master', precio: 100, consumoW: 4, formatosSoportados: 'ITX', longitudMaxGpuMm: 330,
    atributos: { Formato: 'Compacta (ITX)', Ventiladores: '2 incluidos' } },
  { cat: 'CAJA', nombre: 'H5 Flow', marca: 'NZXT', precio: 95, consumoW: 5, formatosSoportados: 'ATX,mATX,ITX', longitudMaxGpuMm: 365,
    atributos: { Formato: 'Media torre', Ventiladores: '2 incluidos' } },
  { cat: 'CAJA', nombre: '4000D Airflow', marca: 'Corsair', precio: 105, consumoW: 5, formatosSoportados: 'ATX,mATX,ITX', longitudMaxGpuMm: 360,
    atributos: { Formato: 'Media torre', Ventiladores: '2 incluidos' } },
  { cat: 'CAJA', nombre: 'Lancool 216', marca: 'Lian Li', precio: 100, consumoW: 6, formatosSoportados: 'ATX,mATX,ITX', longitudMaxGpuMm: 392,
    atributos: { Formato: 'Media torre', Ventiladores: '3 incluidos', RGB: 'Sí' } },
  { cat: 'CAJA', nombre: 'North', marca: 'Fractal Design', precio: 140, consumoW: 4, formatosSoportados: 'ATX,mATX,ITX', longitudMaxGpuMm: 355,
    atributos: { Formato: 'Media torre', Ventiladores: '2 incluidos', Panel: 'Madera' } },
  { cat: 'CAJA', nombre: 'O11 Dynamic EVO', marca: 'Lian Li', precio: 160, consumoW: 2, formatosSoportados: 'ATX,mATX,ITX', longitudMaxGpuMm: 426,
    atributos: { Formato: 'Media torre (acuario)', Ventiladores: 'No incluidos' } },

  // ---- Tarjetas gráficas frecuentes en tiendas de Ecuador ----
  { cat: 'GPU', nombre: 'GeForce RTX 3050 8 GB', marca: 'NVIDIA', precio: 230, consumoW: 130, puntajeRendimiento: 30, longitudMm: 200,
    atributos: { Memoria: '8 GB GDDR6', 'Resolución ideal': '1080p (medio)', 'Trazado de rayos': 'Sí', DLSS: '2' } },
  { cat: 'GPU', nombre: 'GeForce RTX 3060 12 GB', marca: 'NVIDIA', precio: 290, consumoW: 170, puntajeRendimiento: 40, longitudMm: 240,
    atributos: { Memoria: '12 GB GDDR6', 'Resolución ideal': '1080p', 'Trazado de rayos': 'Sí', DLSS: '2' } },
  { cat: 'GPU', nombre: 'GeForce RTX 5050', marca: 'NVIDIA', precio: 250, consumoW: 130, puntajeRendimiento: 42, longitudMm: 220,
    atributos: { Memoria: '8 GB GDDR6', 'Resolución ideal': '1080p', 'Trazado de rayos': 'Sí', DLSS: '4' } },
  { cat: 'GPU', nombre: 'GeForce RTX 5060', marca: 'NVIDIA', precio: 300, consumoW: 145, puntajeRendimiento: 52, longitudMm: 240,
    atributos: { Memoria: '8 GB GDDR7', 'Resolución ideal': '1080p', 'Trazado de rayos': 'Sí', DLSS: '4' } },

  // ---- Monitores ----
  { cat: 'MONITOR', nombre: 'TUF Gaming VG249Q3A', marca: 'ASUS', precio: 140, consumoW: 0, puntajeRendimiento: 35,
    atributos: { Tamaño: '24"', Resolución: '1920 × 1080', Frecuencia: '180 Hz', Panel: 'IPS' } },
  { cat: 'MONITOR', nombre: 'UltraGear 27GS65F', marca: 'LG', precio: 180, consumoW: 0, puntajeRendimiento: 45,
    atributos: { Tamaño: '27"', Resolución: '1920 × 1080', Frecuencia: '180 Hz', Panel: 'IPS' } },
  { cat: 'MONITOR', nombre: 'Odyssey G5 27', marca: 'Samsung', precio: 250, consumoW: 0, puntajeRendimiento: 60,
    atributos: { Tamaño: '27" curvo', Resolución: '2560 × 1440', Frecuencia: '165 Hz', Panel: 'VA' } },
  { cat: 'MONITOR', nombre: 'MAG 274QRF QD E2', marca: 'MSI', precio: 300, consumoW: 0, puntajeRendimiento: 70,
    atributos: { Tamaño: '27"', Resolución: '2560 × 1440', Frecuencia: '180 Hz', Panel: 'Rapid IPS' } },
  { cat: 'MONITOR', nombre: 'ROG Swift PG27AQDM', marca: 'ASUS', precio: 800, consumoW: 0, puntajeRendimiento: 95,
    atributos: { Tamaño: '27"', Resolución: '2560 × 1440', Frecuencia: '240 Hz', Panel: 'OLED' } },

  // ---- Ratones ----
  { cat: 'RATON', nombre: 'Cobra M711', marca: 'Redragon', precio: 20, puntajeRendimiento: 25,
    atributos: { Conexión: 'Cable USB', Sensor: '10 000 DPI', Peso: '120 g' } },
  { cat: 'RATON', nombre: 'G203 Lightsync', marca: 'Logitech', precio: 25, puntajeRendimiento: 35,
    atributos: { Conexión: 'Cable USB', Sensor: '8000 DPI', Peso: '85 g' } },
  { cat: 'RATON', nombre: 'G502 HERO', marca: 'Logitech', precio: 45, puntajeRendimiento: 60,
    atributos: { Conexión: 'Cable USB', Sensor: 'HERO 25K', Peso: '121 g', Botones: '11' } },
  { cat: 'RATON', nombre: 'DeathAdder V3', marca: 'Razer', precio: 90, puntajeRendimiento: 80,
    atributos: { Conexión: 'Cable USB', Sensor: 'Focus Pro 30K', Peso: '59 g' } },
  { cat: 'RATON', nombre: 'Pro X Superlight 2', marca: 'Logitech', precio: 160, puntajeRendimiento: 95,
    atributos: { Conexión: 'Inalámbrico', Sensor: 'HERO 2 32K', Peso: '60 g' } },

  // ---- Teclados ----
  { cat: 'TECLADO', nombre: 'Kumara K552', marca: 'Redragon', precio: 35, puntajeRendimiento: 30,
    atributos: { Tipo: 'Mecánico', Formato: 'TKL (sin numérico)', Interruptor: 'Outemu rojo', Iluminación: 'RGB' } },
  { cat: 'TECLADO', nombre: 'G213 Prodigy', marca: 'Logitech', precio: 50, puntajeRendimiento: 35,
    atributos: { Tipo: 'Membrana', Formato: 'Completo', Iluminación: 'RGB' } },
  { cat: 'TECLADO', nombre: 'Alloy Origins Core', marca: 'HyperX', precio: 90, puntajeRendimiento: 65,
    atributos: { Tipo: 'Mecánico', Formato: 'TKL (sin numérico)', Interruptor: 'HyperX rojo', Iluminación: 'RGB' } },
  { cat: 'TECLADO', nombre: 'BlackWidow V4', marca: 'Razer', precio: 170, puntajeRendimiento: 85,
    atributos: { Tipo: 'Mecánico', Formato: 'Completo', Interruptor: 'Razer verde', Iluminación: 'RGB' } },
  { cat: 'TECLADO', nombre: 'G Pro X TKL', marca: 'Logitech', precio: 200, puntajeRendimiento: 90,
    atributos: { Tipo: 'Mecánico', Formato: 'TKL', Conexión: 'Inalámbrico', Iluminación: 'RGB' } },

  // ---- Altavoces ----
  { cat: 'ALTAVOZ', nombre: 'Pebble V3', marca: 'Creative', precio: 40, puntajeRendimiento: 35,
    atributos: { Potencia: '8 W', Subwoofer: 'No', Conexión: 'USB-C y Bluetooth' } },
  { cat: 'ALTAVOZ', nombre: 'Z313', marca: 'Logitech', precio: 45, puntajeRendimiento: 40,
    atributos: { Potencia: '25 W', Subwoofer: 'Sí', Conexión: '3,5 mm' } },
  { cat: 'ALTAVOZ', nombre: 'R1280T', marca: 'Edifier', precio: 120, puntajeRendimiento: 70,
    atributos: { Potencia: '42 W', Subwoofer: 'No', Conexión: 'RCA y 3,5 mm' } },
  { cat: 'ALTAVOZ', nombre: 'Z623', marca: 'Logitech', precio: 150, puntajeRendimiento: 80,
    atributos: { Potencia: '200 W', Subwoofer: 'Sí', Conexión: 'RCA y 3,5 mm' } },
];

// Reglas que aplica el motor de compatibilidad. Tipos:
//  igual         origen = destino
//  contiene      el valor de origen está en la lista del destino ("AM4,AM5")
//  menor_igual   origen ≤ destino
//  suma_consumo  la potencia de la fuente cubre todo el consumo + margen
export const REGLAS: Partial<ReglaCompatibilidad>[] = [
  { nombre: 'Zócalo del procesador y la placa madre', tipo: 'igual',
    categoriaOrigen: 'CPU', atributoOrigen: 'zocalo', categoriaDestino: 'PLACA', atributoDestino: 'zocalo',
    mensajeError: 'El procesador usa zócalo {origen}, pero la placa madre es {destino}' },
  { nombre: 'Tipo de memoria de la placa', tipo: 'igual',
    categoriaOrigen: 'RAM', atributoOrigen: 'tipoMemoria', categoriaDestino: 'PLACA', atributoDestino: 'tipoMemoria',
    mensajeError: 'La memoria es {origen}, pero la placa madre solo acepta {destino}' },
  { nombre: 'Memoria soportada por el procesador', tipo: 'contiene',
    categoriaOrigen: 'RAM', atributoOrigen: 'tipoMemoria', categoriaDestino: 'CPU', atributoDestino: 'tipoMemoria',
    mensajeError: 'La memoria es {origen}, pero el procesador solo soporta {destino}' },
  { nombre: 'Tamaño de la placa y la caja', tipo: 'contiene',
    categoriaOrigen: 'PLACA', atributoOrigen: 'formato', categoriaDestino: 'CAJA', atributoDestino: 'formatosSoportados',
    mensajeError: 'La placa es {origen}, pero la caja solo admite {destino}' },
  { nombre: 'Largo de la tarjeta gráfica', tipo: 'menor_igual',
    categoriaOrigen: 'GPU', atributoOrigen: 'longitudMm', categoriaDestino: 'CAJA', atributoDestino: 'longitudMaxGpuMm',
    mensajeError: 'La tarjeta mide {origen} mm, pero en la caja solo caben {destino} mm' },
  { nombre: 'Zócalo de la refrigeración', tipo: 'contiene',
    categoriaOrigen: 'CPU', atributoOrigen: 'zocalo', categoriaDestino: 'REFRIG', atributoDestino: 'zocalosSoportados',
    mensajeError: 'El disipador no trae montaje para {origen} (admite {destino})' },
  { nombre: 'Capacidad de la refrigeración', tipo: 'menor_igual',
    categoriaOrigen: 'CPU', atributoOrigen: 'consumoW', categoriaDestino: 'REFRIG', atributoDestino: 'capacidadTermicaW',
    mensajeError: 'El procesador genera {origen} W de calor y el disipador solo disipa {destino} W' },
  { nombre: 'Potencia de la fuente', tipo: 'suma_consumo', categoriaDestino: 'FUENTE', atributoDestino: 'potenciaW', margen: 25,
    mensajeError: 'El equipo necesita al menos {origen} W, pero la fuente solo entrega {destino} W' },
];
