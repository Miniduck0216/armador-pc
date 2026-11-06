// Lógica compartida por ingresar y registro
import { icono } from '../js/iconos.js';
import { $, param } from '../js/util.js';

const BENEFICIOS = [
  'Guarda tus armados y mira si su precio subió o bajó',
  'Alertas cuando un componente baja al precio que quieres',
  'Favoritos, comparaciones guardadas y reseñas',
];

export function prepararAcceso() {
  $('#beneficios').innerHTML = BENEFICIOS.map((b) => `<li>${icono('check', 20)} ${b}</li>`).join('');
}

// Solo se permite volver a páginas de este mismo sitio (evita redirecciones abiertas)
export function destino() {
  const v = param('volver') ?? '';
  return v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : '/cuenta.html';
}

export function mostrarError(texto) {
  const e = $('#error');
  e.textContent = texto;
  e.classList.toggle('oculto', !texto);
}
