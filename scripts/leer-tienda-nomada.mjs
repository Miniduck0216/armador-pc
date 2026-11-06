// Lee TODO el catálogo de NomadaWare (WooCommerce) y lo guarda en un JSON.
//
// Uso (desde la carpeta armador-pc, con Node 20 o superior):
//   node scripts/leer-tienda-nomada.mjs
//
// Opciones:
//   --url https://nomadaware.com.ec     sitio de la tienda (por defecto NomadaWare)
//   --salida frontend/src/datos/nomada.json   archivo que se escribe
//
// Usa la API pública de solo lectura de WooCommerce (no necesita claves):
//   /wp-json/wc/store/v1/products?per_page=100&page=N
// Recorre todas las páginas hasta el final y espera un poco entre cada una.

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const args = process.argv.slice(2);
const opcion = (nombre, porDefecto) => {
  const i = args.indexOf(nombre);
  return i >= 0 && args[i + 1] ? args[i + 1] : porDefecto;
};
const SITIO = opcion('--url', 'https://nomadaware.com.ec').replace(/\/$/, '');
const SALIDA = opcion('--salida', 'frontend/src/datos/nomada.json');
const POR_PAGINA = 100;
const ESPERA_MS = 800;

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const textoPlano = (s = '') =>
  String(s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#8211;/g, '–').replace(/&nbsp;/g, ' ').trim();

async function pedirPagina(pagina) {
  const url = new URL('/wp-json/wc/store/v1/products', SITIO);
  url.searchParams.set('per_page', String(POR_PAGINA));
  url.searchParams.set('page', String(pagina));
  const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'ArmadorPC-lector/1.0' } });
  if (r.status === 400 && pagina > 1) return { datos: [], total: null }; // se pasó de la última página
  if (!r.ok) throw new Error(`La tienda respondió ${r.status} en la página ${pagina}`);
  const total = Number(r.headers.get('x-wp-totalpages') ?? 0) || null;
  return { datos: await r.json(), total };
}

function aProducto(p) {
  const decimales = Number(p.prices?.currency_minor_unit ?? 2);
  const precio = Math.round((Number(p.prices?.price ?? 0) / 10 ** decimales) * 100) / 100;
  const categoria = p.categories?.[0]?.name ?? 'Sin categoría';
  return {
    id: p.id,
    nombre: textoPlano(p.name),
    grupo: categoria,
    categorias: (p.categories ?? []).map((c) => c.name),
    marca: (p.brands ?? [])[0]?.name ?? '',
    precioEfectivo: precio,
    precioTarjeta: null, // la API no publica el precio con tarjeta
    enStock: p.is_in_stock !== false,
    url: p.permalink,
    imagen: p.images?.[0]?.src || p.images?.[0]?.thumbnail || null,
    tipo: p.type,
  };
}

async function main() {
  console.log(`Leyendo ${SITIO} …`);
  const productos = new Map();
  let pagina = 1;
  let total = 1;
  do {
    const { datos, total: paginas } = await pedirPagina(pagina);
    if (paginas) total = paginas;
    for (const p of datos) {
      if (p.type === 'variable' && !p.prices?.price) continue; // sin precio publicado
      productos.set(p.id, aProducto(p));
    }
    console.log(`  página ${pagina}/${total}: ${datos.length} productos`);
    pagina++;
    if (pagina <= total) await dormir(ESPERA_MS);
  } while (pagina <= total);

  const lista = [...productos.values()].filter((p) => p.precioEfectivo > 0).sort((a, b) => a.nombre.localeCompare(b.nombre));
  await mkdir(dirname(SALIDA), { recursive: true });
  await writeFile(SALIDA, JSON.stringify(lista, null, 2), 'utf8');

  const grupos = {};
  for (const p of lista) grupos[p.grupo] = (grupos[p.grupo] ?? 0) + 1;
  console.log(`\nListo: ${lista.length} productos guardados en ${SALIDA}`);
  console.log('Por categoría:', grupos);
}

main().catch((e) => {
  console.error('\nNo se pudo leer la tienda:', e.message);
  console.error('Revisa tu conexión y que el sitio abra en el navegador.');
  process.exit(1);
});
