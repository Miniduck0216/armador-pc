// Encabezado, pie de página, buscador y bandeja de comparación comunes a todas las páginas
import '../styles.scss';
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
  const menu = MENU.map((m) => {
    const clase = `menu__enlace ${m.clave === activo ? 'menu__enlace--activo' : ''}`;
    if (m.url) return `<div class="menu__item"><a class="${clase}" href="${m.url}">${m.texto}</a></div>`;
    const opciones = m.enlaces
      .map(([u, t, d]) => `<a class="menu__opcion" href="${u}">${t}<small class="menu__detalle">${d}</small></a>`)
      .join('');
    return `<div class="menu__item">
        <button type="button" class="${clase}" aria-haspopup="true">${m.texto} ${icono('abajo', 14, 'menu__flecha')}</button>
        <div class="menu__submenu">${opciones}</div>
      </div>`;
  }).join('');
  return `
    <nav class="barra" aria-label="Principal">
      <div class="contenedor barra__contenido">
        <button class="barra__boton-menu" type="button" aria-label="Abrir menú">${icono('menu', 26)}</button>
        ${logo('logo--compacto')}
        <div class="menu" id="menu-principal">${menu}</div>
        <form class="buscador" role="search" action="/componentes.html">
          <input class="buscador__campo" name="buscar" type="search" placeholder="Buscar componentes…" autocomplete="off" aria-label="Buscar componentes">
          <div class="buscador__sugerencias" hidden></div>
        </form>
        <div class="sesion" id="sesion"></div>
      </div>
    </nav>`;
}

function logo(modificador = '') {
  return `<a class="logo ${modificador}" href="/"><img class="logo__imagen" src="/logo-icono.svg" alt="" width="38" height="38"><span class="logo__texto">Armador<b class="logo__marca">PC</b></span></a>`;
}

// Columnas del pie: [título, [[url, texto], ...]]
const COLUMNAS_PIE = [
  ['Armar', [['/configurador.html', 'Configurador'], ['/configurador.html?modo=guiado', 'Asistente por presupuesto'], ['/configuraciones.html', 'Configuraciones']]],
  ['Componentes', [['/componentes.html', 'Biblioteca'], ['/comparar.html', 'Comparar'], ['/componentes.html?categoria=CPU', 'Procesadores'], ['/componentes.html?categoria=GPU', 'Tarjetas gráficas']]],
  ['Herramientas', [['/herramientas.html#comprobador', 'Compatibilidad'], ['/herramientas.html#fuente', 'Fuente de poder'], ['/herramientas.html#refrigeracion', 'Refrigeración'], ['/guias.html', 'Guías']]],
  ['Proyecto', [['/api/docs', 'Documentación de la API'], ['/cuenta.html', 'Mi cuenta'], ['/guia.html?slug=compatibilidad-antes-de-comprar', 'Cómo comprobamos la compatibilidad']]],
];

function pie() {
  const columnas = COLUMNAS_PIE.map(
    ([titulo, enlaces]) => `<div>
        <h4 class="pie__titulo">${titulo}</h4>
        ${enlaces.map(([u, t]) => `<a class="pie__enlace" href="${u}"${u.startsWith('/api') ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`).join('')}
      </div>`,
  ).join('');
  return `
    <div class="contenedor">
      <div class="pie__columnas">
        <div class="pie__marca">
          ${logo()}
          <p class="pie__lema">Arma tu PC con precios reales de Ecuador.</p>
          <div class="pie__barrita"></div>
          <p class="pie__nota">Proyecto académico de Ingeniería Web · UDLA. Los precios son orientativos: confirma siempre en la tienda antes de comprar.</p>
        </div>
        ${columnas}
      </div>
      <div class="pie__final">
        <span>© ${new Date().getFullYear()} ArmadorPC · Hecho con NestJS, SQLite y Vite</span>
        <span>Fotos de referencia: Wikimedia Commons (licencias CC, crédito en cada ficha)</span>
      </div>
    </div>`;
}

function pintarSesion(u) {
  const el = $('#sesion');
  el.classList.add('sesion--lista');
  if (!u) {
    el.innerHTML = `<a class="sesion__enlace" href="/ingresar.html">Ingresar</a><a class="boton boton--pequeno sesion__boton" href="/registro.html">Crear cuenta</a>`;
    return;
  }
  const inicial = esc(u.nombre?.[0]?.toUpperCase() ?? '?');
  const nuevas = u.alertasNuevas;
  el.innerHTML = `
    ${u.esAdmin ? `<a class="campana" href="/admin.html" title="Administración">${icono('admin', 19)}</a>` : ''}
    <a class="campana ${nuevas ? 'campana--nueva' : ''}" href="/cuenta.html#notificaciones" title="Notificaciones y alertas">
      ${icono('campana', 19, 'campana__icono')}${nuevas ? `<span class="campana__globo">${nuevas}</span>` : ''}
    </a>
    <div class="menu-usuario">
      <button type="button" class="menu-usuario__boton"><span class="avatar">${inicial}</span><span class="menu-usuario__nombre">${esc(u.nombre.split(' ')[0])}</span></button>
      <div class="menu-usuario__submenu">
        <a class="menu-usuario__opcion" href="/cuenta.html">Mi cuenta<small class="menu-usuario__detalle">${esc(u.correo)}</small></a>
        <a class="menu-usuario__opcion" href="/cuenta.html#armados">Mis armados</a>
        <a class="menu-usuario__opcion" href="/cuenta.html#alertas">Alertas de precio</a>
        ${u.esAdmin ? '<a class="menu-usuario__opcion" href="/admin.html">Panel de administración</a>' : ''}
        <a class="menu-usuario__opcion" href="#" data-salir>Cerrar sesión</a>
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
  const entrada = form.querySelector('.buscador__campo');
  const caja = form.querySelector('.buscador__sugerencias');
  const buscar = retrasar(async () => {
    const q = entrada.value.trim();
    if (q.length < 2) return (caja.hidden = true);
    try {
      const r = await api(`/buscar?q=${encodeURIComponent(q)}`);
      caja.innerHTML = r.length
        ? r
            .slice(0, 6)
            .map(
              (p) => `<a class="buscador__sugerencia" href="/producto.html?id=${p.id}">${imagen(p.imagen, p.nombre, 'buscador__foto')}
                <span class="buscador__nombre">${esc(p.nombreCompleto)}<small class="buscador__categoria">${esc(p.categoria.nombre)}</small></span><b>${dinero(p.precio)}</b></a>`,
            )
            .join('') + `<a class="buscador__ver-todo" href="/componentes.html?buscar=${encodeURIComponent(q)}">Ver todos los resultados</a>`
        : `<div class="buscador__vacio">Sin resultados para “${esc(q)}”</div>`;
      caja.hidden = false;
    } catch {
      caja.hidden = true;
    }
  }, 220);
  entrada.addEventListener('input', buscar);
  entrada.addEventListener('focus', () => {
    if (entrada.value.trim().length >= 2) caja.hidden = false;
  });
  document.addEventListener('click', (e) => {
    if (!form.contains(e.target)) caja.hidden = true;
  });
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
  const visible = c.items.length > 0 && !location.pathname.startsWith('/comparar');
  el.hidden = !visible;
  document.body.classList.toggle('pagina--con-bandeja', visible);
  if (!visible) return;
  const items = c.items
    .map(
      (x) => `<span class="bandeja-comparar__item">${imagen(x.imagen, x.nombre, 'bandeja-comparar__foto')}<em class="bandeja-comparar__nombre">${esc(x.nombre)}</em>
        <button class="bandeja-comparar__quitar" data-quitar="${x.id}" aria-label="Quitar">✕</button></span>`,
    )
    .join('');
  const enlace = `/comparar.html?categoria=${c.categoria}&ids=${c.items.map((x) => x.id).join(',')}`;
  el.innerHTML = `
    <div class="contenedor bandeja-comparar__contenido">
      <strong class="bandeja-comparar__titulo">${icono('comparar')} Comparar (${c.items.length}/3)</strong>
      <div class="bandeja-comparar__items">${items}</div>
      <button class="enlace bandeja-comparar__vaciar" data-vaciar>Vaciar</button>
      <a class="boton boton--pequeno ${c.items.length < 2 ? 'boton--deshabilitado' : ''}" href="${enlace}">Comparar ahora</a>
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
  // La barra ya existe y los estilos ya cargaron (se importan arriba): el contenido
  // entra suave sin empujar nada (ver bloques/_pagina.scss)
  document.body.classList.replace('pagina--cargando', 'pagina--lista');
  const footer = document.createElement('footer');
  footer.className = `pie ${document.querySelector('.acceso') ? 'pie--pegado' : ''}`;
  footer.innerHTML = pie();
  document.body.append(footer);

  $('.barra__boton-menu').addEventListener('click', () => $('#menu-principal').classList.toggle('menu--abierto'));
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
