// Productos de NomadaWare dentro del selector del configurador.
// Se muestran aparte del catálogo: no tienen ficha técnica, así que no se revisa su
// compatibilidad y no se agregan al armado (se compran en la tienda).
import { icono } from '../js/iconos.js';
import { dinero, esc, imagen } from '../js/util.js';
import productos from '../datos/nomada.json';

// Palabras que indican a qué categoría pertenece cada producto de la tienda
const PALABRAS = {
  CPU: /procesador|ryzen|intel core|\bcore i\d|athlon|pentium|celeron/i,
  PLACA: /placa madre|motherboard|\b[abhxz]\d{3}\b/i,
  REFRIG: /refrigera|disipador|cooler|enfriamiento|liquid|\baio\b|pasta t[ée]rmica|ventilador/i,
  RAM: /\bram\b|ddr[45]|memoria/i,
  GPU: /tarjeta gr[aá]fica|\bgpu\b|geforce|radeon|\brtx\b|\bgtx\b|\brx \d/i,
  ALMAC: /\bssd\b|nvme|m\.?2|disco duro|\bhdd\b|almacenamiento/i,
  FUENTE: /fuente|power supply|\bpsu\b|\d+\s?w\b/i,
  CAJA: /\bcaja\b|gabinete|\bcase\b/i,
  MONITOR: /monitor|pantalla/i,
  RATON: /rat[oó]n|mouse/i,
  TECLADO: /teclado|keyboard/i,
  ALTAVOZ: /altavoz|parlante|bocina|speaker/i,
};

// Solo se aceptan enlaces http(s) que vienen del archivo de la tienda
const enlaceSeguro = (u) => (/^https?:\/\//.test(u || '') ? esc(u) : '#');

export function buscarProductos(codigo, texto) {
  const patron = PALABRAS[codigo];
  const termino = texto.toLowerCase();
  return productos
    .filter((p) => patron && patron.test(`${p.grupo} ${p.nombre}`))
    .filter((p) => !termino || `${p.grupo} ${p.nombre}`.toLowerCase().includes(termino))
    .sort((a, b) => a.precioEfectivo - b.precioEfectivo);
}

// HTML de la sección "Productos de NomadaWare" del selector (vacío si no hay)
export function productosTienda(codigo, texto) {
  const lista = buscarProductos(codigo, texto);
  if (!lista.length) return '';
  const filas = lista
    .map(
      (p) => `<div class="opcion-pieza">
        ${imagen(p.imagen, p.nombre, 'opcion-pieza__foto')}
        <div><b class="opcion-pieza__nombre">${esc(p.nombre)}</b><div class="texto texto--pequeno texto--tenue">${esc(p.grupo)}</div></div>
        <div class="opcion-pieza__precio">${dinero(p.precioEfectivo)}<small class="opcion-pieza__tienda">NomadaWare</small></div>
        <a class="boton boton--pequeno boton--secundario opcion-pieza__boton" href="${enlaceSeguro(p.url)}" target="_blank" rel="noopener">Ver en tienda</a>
      </div>`,
    )
    .join('');
  return `<div class="selector-piezas__tienda">
      <p class="texto texto--pequeno texto--tenue">${icono('tienda', 14)} Productos de NomadaWare (${lista.length}). Se compran en la tienda, no se agregan al armado.</p>
      ${filas}
    </div>`;
}
