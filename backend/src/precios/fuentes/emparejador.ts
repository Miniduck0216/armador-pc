// Decide si un producto de una tienda corresponde a un componente del catálogo.
// Ejemplo: "Tarjeta Gráfica ASUS Prime GeForce RTX 5070 Ti 16GB" SÍ es "GeForce RTX 5070 Ti",
// pero NO es "GeForce RTX 5070" (le sobra el "Ti") ni un "Laptop ... RTX 5070".

export interface ComponenteBuscado {
  nombre: string;
  marca: string;
  categoria: string; // código: CPU, GPU, RAM...
  precioReferencia: number;
}

// Sufijos que cambian de modelo: si el catálogo no los tiene, el título tampoco debe tenerlos
const SUFIJOS = ['ti', 'super', 'xt', 'xtx', 'x3d', 'gre', 'k', 'kf', 'f', 'g', 'gt', 'x'];

// Productos que contienen el modelo pero no son la pieza suelta
const EXCLUIR_SIEMPRE = [
  'laptop', 'notebook', 'portatil', 'computador', 'computadora', 'desktop', 'workstation', 'gamer pc',
  'pc gamer', 'all in one', 'todo en uno', 'combo', 'usado', 'reacondicionado', 'tablet', 'consola',
];

// Palabras que debe tener el título según la categoría (al menos una)
const PALABRAS_CATEGORIA: Record<string, string[]> = {
  CPU: ['procesador', 'cpu', 'ryzen', 'core', 'intel'],
  GPU: ['tarjeta', 'video', 'grafica', 'geforce', 'radeon', 'rtx', 'gtx', 'gpu'],
  RAM: ['memoria', 'ram', 'ddr4', 'ddr5', 'dimm'],
  ALMAC: ['ssd', 'nvme', 'disco', 'unidad', 'm.2', 'm2'],
  PLACA: ['placa', 'mainboard', 'motherboard', 'tarjeta madre', 'board'],
  FUENTE: ['fuente', 'psu', 'poder', 'power'],
  CAJA: ['case', 'caja', 'gabinete', 'chasis', 'torre'],
  REFRIG: ['disipador', 'cooler', 'enfriamiento', 'refrigeracion', 'liquida', 'aio'],
  MONITOR: ['monitor', 'pantalla'],
  RATON: ['mouse', 'raton'],
  TECLADO: ['teclado', 'keyboard'],
  ALTAVOZ: ['parlante', 'parlantes', 'altavoz', 'altavoces', 'bocina', 'speaker'],
};

// Marcas que se escriben de varias formas
const ALIAS_MARCA: Record<string, string[]> = {
  'western digital': ['western digital', 'wd'],
  'g.skill': ['g.skill', 'gskill', 'g skill'],
  'cooler master': ['cooler master', 'coolermaster'],
  'lian li': ['lian li', 'lianli'],
  'fractal design': ['fractal'],
};

export function normalizar(texto: string): string {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[™®]/g, '')
    .replace(/[^a-z0-9.\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Palabras del texto, separando además números pegados a letras: "5070ti" -> "5070", "ti"
export function fichas(texto: string): Set<string> {
  const conjunto = new Set<string>();
  for (const palabra of normalizar(texto).split(' ')) {
    if (!palabra) continue;
    conjunto.add(palabra);
    const partes = palabra.match(/[a-z]+|\d+(?:\.\d+)?/g) ?? [];
    // "i5-13400f" ya llega como "i5 13400f"; "13400f" -> "13400", "f"
    if (partes.length > 1) partes.forEach((p) => conjunto.add(p));
  }
  return conjunto;
}

// Modelo: palabras con dígitos del nombre ("5070", "7800x3d", "ddr5", "32")
function claves(nombre: string): string[] {
  return normalizar(nombre)
    .split(' ')
    .filter((p) => /\d/.test(p) && !/^\d+(gb|tb|mhz|w|mm)$/.test(p));
}

export function coincide(buscado: ComponenteBuscado, titulo: string, precio: number): boolean {
  const t = normalizar(titulo);
  const ft = fichas(titulo);
  const fn = fichas(buscado.nombre);

  // 1. No es un equipo completo ni otra cosa
  const excluir = EXCLUIR_SIEMPRE.filter((e) => !(buscado.categoria === 'REFRIG' && e === 'all in one'));
  if (excluir.some((e) => t.includes(e))) return false;

  // 2. Es de la categoría correcta
  const palabras = PALABRAS_CATEGORIA[buscado.categoria] ?? [];
  if (palabras.length && !palabras.some((p) => t.includes(p))) return false;

  // 3. Tiene todas las palabras de modelo del catálogo
  for (const c of claves(buscado.nombre)) {
    if (!ft.has(c)) return false;
  }

  // 3b. Tiene los sufijos de modelo que el catálogo sí tiene ("XT", "Ti", "Super")
  for (const palabra of normalizar(buscado.nombre).split(' ')) {
    if (SUFIJOS.includes(palabra) && palabra.length > 1 && !ft.has(palabra)) return false;
  }

  // 4. No tiene sufijos de otro modelo (Ti, Super, XT, X3D, F...) que el catálogo no tenga.
  //    Se revisan solo los sufijos que van justo después del número de modelo.
  const numeros = [...fn].filter((f) => /^\d{3,5}$/.test(f));
  for (const n of numeros) {
    const despues = t.match(new RegExp(`\\b${n}\\s?([a-z0-9]+)`, 'g')) ?? [];
    for (const trozo of despues) {
      const sufijo = trozo.replace(n, '').trim();
      const sufijoLetras = sufijo.match(/^[a-z]+/)?.[0];
      if (sufijoLetras && SUFIJOS.includes(sufijoLetras) && !fn.has(sufijoLetras) && !fn.has(n + sufijoLetras)) return false;
    }
  }

  // 5. La marca aparece (en tarjetas gráficas la "marca" es NVIDIA/AMD y el título suele traer ASUS, MSI...)
  if (buscado.categoria !== 'GPU') {
    const marca = normalizar(buscado.marca);
    const variantes = ALIAS_MARCA[marca] ?? [marca];
    if (!variantes.some((v) => t.includes(v))) return false;
  }

  // 6. El precio es razonable (evita accesorios baratos o equipos caros con el mismo nombre)
  if (buscado.precioReferencia > 0) {
    if (precio < buscado.precioReferencia * 0.4 || precio > buscado.precioReferencia * 3.2) return false;
  }
  return true;
}

// Texto para buscar en la tienda: el modelo sin palabras genéricas
export function consultaPorDefecto(nombre: string): string {
  return nombre
    .replace(/\b(GeForce|Radeon|Core|Ryzen)\b/gi, (m) => (/ryzen|core/i.test(m) ? m : ''))
    .replace(/\s+/g, ' ')
    .trim();
}
