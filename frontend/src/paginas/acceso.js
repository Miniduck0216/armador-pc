// Lógica compartida por ingresar y registro
import { icono } from '../js/iconos.js';
import { $, param } from '../js/util.js';

const BENEFICIOS = [
  'Guarda tus armados y mira si su precio subió o bajó',
  'Alertas cuando un componente baja al precio que quieres',
  'Favoritos, comparaciones guardadas y reseñas',
];

export function prepararAcceso() {
  $('#beneficios').innerHTML = BENEFICIOS.map((b) => `<li class="acceso__beneficio">${icono('check', 20, 'icono--amarillo')} ${b}</li>`).join('');
}

// Solo se permite volver a páginas de este mismo sitio (evita redirecciones abiertas)
export function destino() {
  const v = param('volver') ?? '';
  return v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : '/cuenta.html';
}

export function mostrarError(texto) {
  const e = $('#error');
  e.textContent = texto;
  e.hidden = !texto;
  // Reinicia la animación de "sacudir" para que se note cada nuevo error
  e.classList.remove('aviso--sacudir');
  if (texto) {
    void e.offsetWidth; // obliga al navegador a recalcular, así la animación vuelve a empezar
    e.classList.add('aviso--sacudir');
  }
}

// Estados visuales del botón de ingreso/registro
export const botonCargando = (b, si) => {
  b.disabled = si;
  b.classList.toggle('boton--cargando', si);
};

// Éxito: el botón se pone verde, la página se desvanece y luego navega
export function salirConExito(b, texto, url) {
  b.classList.remove('boton--cargando');
  b.classList.add('boton--listo');
  b.textContent = texto;
  setTimeout(() => document.body.classList.add('pagina--saliendo'), 350);
  setTimeout(() => (location.href = url), 600);
}
