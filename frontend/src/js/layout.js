// Encabezado, pie de página, buscador y bandeja de comparación comunes a todas las páginas
import '../estilos/base.css';
import '../estilos/componentes.css';
import '../estilos/paginas.css';
import { api, enviar } from './api.js';
import { icono } from './iconos.js';
import { $, dinero, esc, imagen, retrasar } from './util.js';
import { leerComparar, vaciarComparar, alternarComparar } from './estado.js';

const MENU = [
  {
    texto: 'Armar PC',
    clave: 'armar',
    enlaces: [
      ['/configurador.html', 'Configurador', 'Elige pieza por pieza con compatibilidad en vivo'],
      ['/configurador.html?modo=guiado', 'Asistente por presupuesto', 'Dinos cuánto quieres gastar y te armamos uno'],
      ['/configuraciones.html', 'Configuraciones recomendadas', 'Equipos listos para jugar, crear o trabajar'],
    ],
  },
  {
    texto: 'Componentes',
    clave: 'componentes',
    enlaces: [
      ['/componentes.html', 'Biblioteca de componentes', 'Precios de tiendas de Ecuador'],
      ['/comparar.html', 'Comparar componentes', 'Hasta 3 modelos lado a lado'],
      ['/componentes.html?orden=bajada', 'Bajadas de precio', 'Lo que está más barato que de costumbre'],
    ],
  },
  {
    texto: 'Herramientas',
    clave: 'herramientas',
    enlaces: [
      ['/herramientas.html#comprobador', 'Comprobador de compatibilidad', '¿Encajan tus piezas entre sí?'],
      ['/herramientas.html#fuente', 'Calculadora de fuente', 'Cuántos vatios necesitas'],
      ['/herramientas.html#refrigeracion', 'Calculadora de refrigeración', 'Aire o líquida, según tu procesador'],
    ],
  },
  { texto: 'Guías', clave: 'guias', url: '/guias.html' },
];

let usuarioActual = null;

function encabezado(activo) {
  const menu = MENU.map((m) =>
    m.url
      ? `<div><a href="${m.url}" class="${m.clave === activo ? 'activo' : ''}">${m.texto}</a></div>`
      : `<div>
          <button type="button" class="${m.clave === activo ? 'activo' : ''}" aria-haspopup="true">${m.texto} ${icono('abajo', 14, 'flecha')}</button>
          <div class="submenu">${m.enlaces.map(([u, t, d]) => `<a href="${u}">${t}<small>${d}</small></a>`).join('')}</div>
        </div>`,
  ).join('');
  return `
    <nav class="barra" aria-label="Principal">
      <div class="contenedor">
        <button class="boton-menu" type="button" aria-label="Abrir menú">${icono('menu', 26)}</button>
        <a class="logo" href="/"><img src="/logo-icono.svg" alt="" width="38" height="38"><span>Armador<b>PC</b></span></a>
        <div class="menu" id="menu-principal">${menu}</div>
        <form class="buscador" role="search" action="/componentes.html">
          <input name="buscar" type="search" placeholder="Buscar componentes…" autocomplete="off" aria-label="Buscar componentes">
          <div class="sugerencias oculto"></div>
        </form>
        <div class="sesion" id="sesion"></div>
      </div>
    </nav>`;
}

function pie() {
  return `
    <div class="contenedor">
      <div class="pie-columnas">
        <div>
          <a class="logo" href="/"><img src="/logo-icono.svg" alt="" width="38" height="38"><span>Armador<b>PC</b></span></a>
          <p class="lema">Arma tu PC con precios reales de Ecuador.</p>
          <div class="barrita"></div>
          <p class="pequeno" style="margin-top:14px">Proyecto académico de Ingeniería Web · UDLA. Los precios son orientativos: confirma siempre en la tienda antes de comprar.</p>
        </div>
        <div>
          <h4>Armar</h4>
          <a href="/configurador.html">Configurador</a>
          <a href="/configurador.html?modo=guiado">Asistente por presupuesto</a>
          <a href="/configuraciones.html">Configuraciones</a>
        </div>
        <div>
          <h4>Componentes</h4>
          <a href="/componentes.html">Biblioteca</a>
          <a href="/comparar.html">Comparar</a>
          <a href="/componentes.html?categoria=CPU">Procesadores</a>
          <a href="/componentes.html?categoria=GPU">Tarjetas gráficas</a>
        </div>
        <div>
          <h4>Herramientas</h4>
          <a href="/herramientas.html#comprobador">Compatibilidad</a>
          <a href="/herramientas.html#fuente">Fuente de poder</a>
          <a href="/herramientas.html#refrigeracion">Refrigeración</a>
          <a href="/guias.html">Guías</a>
        </div>
        <div>
          <h4>Proyecto</h4>
          <a href="/api/docs" target="_blank" rel="noopener">Documentación de la API</a>
          <a href="/cuenta.html">Mi cuenta</a>
          <a href="/guia.html?slug=compatibilidad-antes-de-comprar">Cómo comprobamos la compatibilidad</a>
        </div>
      </div>
      <div class="pie-final">
        <span>© ${new Date().getFullYear()} ArmadorPC · Hecho con NestJS, SQLite y Vite</span>
        <span>Fotos de referencia: Wikimedia Commons (licencias CC, crédito en cada ficha)</span>
      </div>
    </div>`;
}

function pintarSesion(u) {
  const el = $('#sesion');
  if (!u) {
    el.innerHTML = `<a class="enlace-claro" href="/ingresar.html">Ingresar</a><a class="boton pequeno" href="/registro.html">Crear cuenta</a>`;
    return;
  }
  const inicial = esc(u.nombre?.[0]?.toUpperCase() ?? '?');
  el.innerHTML = `
    ${u.esAdmin ? `<a class="campana" href="/admin.html" title="Administración">${icono('admin', 19)}</a>` : ''}
    <a class="campana" href="/cuenta.html#alertas" title="Alertas de precio">${icono('campana', 19)}${u.alertasNuevas ? `<span class="globo">${u.alertasNuevas}</span>` : ''}</a>
    <div class="menu-usuario">
      <button type="button" class="chip-usuario"><span class="avatar">${inicial}</span><span class="nombre">${esc(u.nombre.split(' ')[0])}</span></button>
      <div class="submenu derecha">
        <a href="/cuenta.html">Mi cuenta<small>${esc(u.correo)}</small></a>
        <a href="/cuenta.html#armados">Mis armados</a>
        <a href="/cuenta.html#alertas">Alertas de precio</a>
        ${u.esAdmin ? '<a href="/admin.html">Panel de administración</a>' : ''}
        <a href="#" data-salir>Cerrar sesión</a>
      </div>
    </div>`;
  el.querySelector('[data-salir]').addEventListener('click', async (e) => {
    e.preventDefault();
    await enviar('/auth/salir');
    location.href = '/';
  });
}

function activarBuscador() {
  const form = $('.buscador');
  const entrada = form.querySelector('input');
  const caja = form.querySelector('.sugerencias');
  const buscar = retrasar(async () => {
    const q = entrada.value.trim();
    if (q.length < 2) return caja.classList.add('oculto');
    try {
      const r = await api(`/buscar?q=${encodeURIComponent(q)}`);
      caja.innerHTML = r.length
        ? r
            .slice(0, 6)
            .map(
              (p) => `<a href="/producto.html?id=${p.id}">${imagen(p.imagen, p.nombre)}
                <span>${esc(p.nombreCompleto)}<small>${esc(p.categoria.nombre)}</small></span><b>${dinero(p.precio)}</b></a>`,
            )
            .join('') + `<a class="ver-todo" href="/componentes.html?buscar=${encodeURIComponent(q)}">Ver todos los resultados</a>`
        : `<div class="tenue pequeno" style="padding:12px">Sin resultados para “${esc(q)}”</div>`;
      caja.classList.remove('oculto');
    } catch {
      caja.classList.add('oculto');
    }
  }, 220);
  entrada.addEventListener('input', buscar);
  entrada.addEventListener('focus', () => entrada.value.trim().length >= 2 && caja.classList.remove('oculto'));
  document.addEventListener('click', (e) => !form.contains(e.target) && caja.classList.add('oculto'));
}

// Bandeja flotante "Comparar (2/3)" visible en todas las páginas
function bandejaComparar() {
  let el = $('#bandeja-comparar');
  if (!el) {
    el = document.createElement('div');
    el.id = 'bandeja-comparar';
    el.className = 'bandeja-comparar';
    document.body.append(el);
  }
  const c = leerComparar();
  if (!c.items.length || location.pathname.startsWith('/comparar')) return el.classList.add('oculto');
  el.classList.remove('oculto');
  el.innerHTML = `
    <div class="contenedor">
      <strong>${icono('comparar')} Comparar (${c.items.length}/3)</strong>
      <div class="bandeja-items">${c.items
        .map((x) => `<span>${imagen(x.imagen, x.nombre)}<em>${esc(x.nombre)}</em><button data-quitar="${x.id}" aria-label="Quitar">✕</button></span>`)
        .join('')}</div>
      <button class="enlace" data-vaciar>Vaciar</button>
      <a class="boton pequeno ${c.items.length < 2 ? 'deshabilitado' : ''}" href="/comparar.html?categoria=${c.categoria}&ids=${c.items.map((x) => x.id).join(',')}">Comparar ahora</a>
    </div>`;
  el.querySelectorAll('[data-quitar]').forEach((b) =>
    b.addEventListener('click', () => alternarComparar({ id: Number(b.dataset.quitar), categoria: c.categoria })),
  );
  el.querySelector('[data-vaciar]').addEventListener('click', vaciarComparar);
}

/**
 * Pinta encabezado y pie. Devuelve una promesa con el usuario (o null).
 * @param {string} activo clave del menú resaltado
 */
export function montar(activo = '') {
  document.body.insertAdjacentHTML('afterbegin', `<header>${encabezado(activo)}</header>`);
  const footer = document.createElement('footer');
  footer.className = 'pie';
  footer.innerHTML = pie();
  document.body.append(footer);

  $('.boton-menu').addEventListener('click', () => $('#menu-principal').classList.toggle('abierto'));
  activarBuscador();
  bandejaComparar();
  window.addEventListener('comparar', bandejaComparar);

  return api('/auth/yo')
    .then(({ usuario }) => {
      usuarioActual = usuario;
      pintarSesion(usuario);
      return usuario;
    })
    .catch(() => {
      pintarSesion(null);
      return null;
    });
}

export const usuario = () => usuarioActual;
