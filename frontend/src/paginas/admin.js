// Panel de administración: menú lateral y navegación entre secciones.
// Cada sección vive en su propio archivo (carpeta admin/) y exporta:
//   titulo, icono, permiso → para el menú
//   html(contexto)         → devuelve el HTML de la sección
//   conectar(zona, ctx)    → (opcional) conecta sus botones y formularios
//   puedeSalir()           → (opcional) pregunta antes de salir si hay cambios sin guardar
import { montar } from '../js/layout.js';
import { icono } from '../js/iconos.js';
import { $, errorEn } from '../js/util.js';
import tablero from './admin/tablero.js';
import precios from './admin/precios.js';
import procesadores from './admin/procesadores.js';
import componentes from './admin/componentes.js';
import usuarios from './admin/usuarios.js';
import roles, { hayCambios } from './admin/roles/controlador.js';
import revisiones from './admin/revisiones.js';
import reportes from './admin/reportes.js';
import reglas from './admin/reglas.js';

const SECCIONES = { tablero, precios, procesadores, componentes, usuarios, roles, revisiones, reportes, reglas };

let usuario = null;
let actual = null;

// El menú solo muestra lo que el rol puede usar; aun así, el servidor vuelve a
// comprobar el permiso en cada petición (la seguridad real está en el backend).
const puede = (clave) => usuario.permisos.includes(SECCIONES[clave].permiso);

async function mostrar(clave, { forzar = false } = {}) {
  // Si la sección actual tiene cambios sin guardar, se pregunta antes de salir
  if (!forzar && actual && actual !== clave && !(await SECCIONES[actual].puedeSalir?.() ?? true)) return;
  // Si la sección no existe o el rol no tiene permiso, se abre la primera permitida
  actual = SECCIONES[clave] && puede(clave) ? clave : Object.keys(SECCIONES).find(puede);
  const seccion = SECCIONES[actual];
  document.querySelectorAll('#menu [data-ir]').forEach((b) => b.classList.toggle('panel__opcion--activa', b.dataset.ir === actual));
  history.replaceState(null, '', `#${actual}`);

  const contexto = {
    usuario,
    recargar: () => mostrar(actual, { forzar: true }),
    seccionActual: () => actual,
  };
  try {
    const html = await seccion.html(contexto);
    // Cada vez se crea un contenedor nuevo: así entra con animación y sus eventos no se repiten
    $('#contenido').innerHTML = `<div class="panel__seccion"><h2 class="panel__titulo">${seccion.titulo}</h2>${html}</div>`;
    seccion.conectar?.($('#contenido .panel__seccion'), contexto);
  } catch (e) {
    errorEn($('#contenido'), e);
  }
}

// Botones del menú y enlaces internos (por ejemplo "Ver tiendas" del tablero)
document.addEventListener('click', (e) => {
  const ir = e.target.closest('[data-ir]');
  if (ir) mostrar(ir.dataset.ir);
});

// Si se cierra o recarga la página con permisos sin guardar, el navegador pregunta antes
window.addEventListener('beforeunload', (e) => {
  if (hayCambios()) e.preventDefault();
});

montar('').then((u) => {
  if (!u) return (location.href = `/ingresar.html?volver=${encodeURIComponent('/admin.html')}`);
  if (!u.esAdmin) {
    $('#contenido').innerHTML = '<div class="aviso aviso--error">Tu rol no tiene acceso al panel de administración.</div>';
    return;
  }
  usuario = { ...u, permisos: u.permisos ?? [] };
  $('#menu').innerHTML = Object.entries(SECCIONES)
    .filter(([clave]) => puede(clave))
    .map(([clave, s]) => `<button class="panel__opcion" data-ir="${clave}">${icono(s.icono, 17)} ${s.titulo}</button>`)
    .join('');
  mostrar(location.hash.slice(1));
});
