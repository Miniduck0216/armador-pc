import { montar } from '../js/layout.js';
import { api, borrar, enviar, irAIngresar } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, aviso, confirmar, dinero, errorEn, esc, estrellas, fecha, imagen, tabla } from '../js/util.js';
import { activarTarjetas, tarjetaProducto } from '../js/tarjetas.js';

montar('');

let datos = null;
const SECCIONES = [
  ['notificaciones', 'Notificaciones', 'campana'],
  ['armados', 'Mis armados', 'pc'],
  ['alertas', 'Alertas de precio', 'campana'],
  ['favoritos', 'Favoritos', 'corazon'],
  ['comparaciones', 'Comparaciones', 'comparar'],
  ['resenas', 'Mis reseñas', 'estrella'],
];

// Cambio de precio de un armado desde que se guardó (▼ verde si bajó)
const diferencia = (d) => (d ? `<div class="variacion variacion--${d < 0 ? 'baja' : 'sube'}">${d < 0 ? '▼' : '▲'} ${dinero(Math.abs(d))}</div>` : '');

// Una función por sección: recibe los datos de /api/cuenta y devuelve el HTML
const vista = {
  armados: (d) =>
    tabla(
      ['Armado', 'Piezas', ['Al guardar', 'derecha'], ['Hoy', 'derecha'], 'Estado', ''],
      d.armados.map((a) => [
        `<a href="/armado.html?id=${a.id}"><b>${esc(a.nombre)}</b></a><small class="tabla__detalle">${fecha(a.fechaCreacion)}</small>`,
        a.piezas,
        [dinero(a.precioTotal), 'derecha'],
        [`<b>${dinero(a.precioHoy)}</b>${diferencia(a.diferencia)}`, 'derecha'],
        `<span class="estado-armado estado-armado--${a.estado}">${esc(a.nombreEstado)}</span>`,
        [`<button class="enlace enlace--peligro" data-borrar="armados/${a.id}">Eliminar</button>`, 'derecha'],
      ]),
      { vacio: 'Todavía no guardas armados. <a href="/configurador.html">Abre el configurador</a> y pulsa «Guardar».' },
    ),

  notificaciones: (d) =>
    d.notificaciones.length
      ? `<ul class="avisos">${d.notificaciones
          .map((n) => {
            const texto = n.enlace.startsWith('/') ? `<a class="avisos__texto" href="${esc(n.enlace)}">${esc(n.mensaje)}</a>` : `<span class="avisos__texto">${esc(n.mensaje)}</span>`;
            return `<li class="avisos__item ${n.nueva ? 'avisos__item--nueva' : ''}">${texto}<span class="avisos__fecha">${fecha(n.fecha, true)}</span></li>`;
          })
          .join('')}</ul>`
      : '<div class="vacio">No tienes notificaciones. Aquí verás cuando un técnico revise tus armados.</div>',

  alertas: (d) =>
    d.alertas.length
      ? `<div class="pila">${d.alertas
          .map((a) => {
            const estado = a.disparada
              ? `<span class="insignia ${a.nueva ? 'insignia--amarilla' : 'insignia--verde'}">${a.nueva ? '¡Nueva! ' : ''}Alcanzó ${dinero(a.precioAlcanzado)}</span>`
              : '<span class="insignia insignia--gris">Esperando</span>';
            return `<div class="pieza-fila pieza-fila--con-accion">
              ${imagen(a.componente.imagen, a.componente.nombre, 'pieza-fila__foto')}
              <span class="pieza-fila__texto"><a href="/producto.html?id=${a.componente.id}"><b>${esc(a.componente.nombre)}</b></a>
                <em class="pieza-fila__detalle">Objetivo ${dinero(a.precioObjetivo)} · hoy ${dinero(a.actual)}${a.falta ? ` · faltan ${dinero(a.falta)}` : ''}</em></span>
              ${estado}
              <button class="icono-boton" data-borrar="alertas/${a.id}" title="Eliminar">${icono('basura', 16)}</button></div>`;
          })
          .join('')}</div>`
      : '<div class="vacio">No tienes alertas. Entra a cualquier componente y usa «Avísame si baja de precio».</div>',

  favoritos: (d) =>
    d.favoritos.length
      ? `<div class="grilla grilla--auto" id="favoritos">${d.favoritos.map((p) => tarjetaProducto(p)).join('')}</div>`
      : '<div class="vacio">Sin favoritos todavía. Usa el corazón en la ficha de un componente.</div>',

  comparaciones: (d) =>
    d.comparaciones.length
      ? `<div class="pila">${d.comparaciones
          .map(
            (c) => `<div class="tienda-fila"><a href="/comparar.html?categoria=CPU&ids=${c.a.id},${c.b.id}"><b>${esc(c.a.nombre)}</b> vs <b>${esc(c.b.nombre)}</b></a>
              <span class="tienda-fila__cantidad">${fecha(c.fecha)}</span><button class="enlace enlace--peligro" data-borrar="comparaciones/${c.id}">Eliminar</button></div>`,
          )
          .join('')}</div>`
      : '<div class="vacio">Puedes guardar comparaciones de procesadores desde <a href="/comparar.html?categoria=CPU">Comparar</a>.</div>',

  resenas: (d) =>
    d.resenas.length
      ? `<div class="caja">${d.resenas
          .map(
            (r) => `<div class="resena"><div class="fila fila--entre"><a href="/producto.html?id=${r.componente.id}"><b>${esc(r.componente.nombre)}</b></a><span class="texto texto--pequeno texto--tenue">${fecha(r.fecha)}</span></div>
              <div>${estrellas(r.calificacion)}</div><p>${esc(r.comentario)}</p><button class="enlace enlace--peligro" data-borrar="resenas/${r.id}">Eliminar</button></div>`,
          )
          .join('')}</div>`
      : '<div class="vacio">Aún no escribes reseñas.</div>',
};

function mostrar(clave) {
  if (!vista[clave]) clave = datos.notificaciones.some((n) => n.nueva) ? 'notificaciones' : 'armados';
  document.querySelectorAll('#menu [data-seccion]').forEach((b) => b.classList.toggle('panel__opcion--activa', b.dataset.seccion === clave));
  const [, titulo] = SECCIONES.find(([k]) => k === clave);
  $('#contenido').innerHTML = `<div class="panel__seccion"><h2 class="panel__titulo">${titulo}</h2>${vista[clave](datos)}</div>`;
  if (clave === 'favoritos' && $('#favoritos')) activarTarjetas($('#favoritos'), datos.favoritos);
  history.replaceState(null, '', `#${clave}`);
}

async function cargar() {
  try {
    datos = await api('/cuenta');
  } catch (e) {
    if (e.estado === 401) return irAIngresar();
    return errorEn($('#contenido'), e);
  }
  const p = datos.perfil;
  $('#perfil').innerHTML = `<span class="avatar avatar--grande">${esc(p.nombre[0].toUpperCase())}</span>
    <div><h1 class="perfil__nombre">${esc(p.nombre)}</h1><p class="perfil__datos">${esc(p.correo)} · ${p.esAdmin ? 'Administrador · ' : ''}miembro desde ${fecha(p.fechaRegistro)}</p></div>
    <button class="boton boton--secundario perfil__salir" id="salir">${icono('salir', 16)} Cerrar sesión</button>`;
  $('#salir').addEventListener('click', async () => {
    await enviar('/auth/salir');
    location.href = '/';
  });
  $('#menu').innerHTML =
    SECCIONES.map(([k, t, i]) => `<button class="panel__opcion" data-seccion="${k}">${icono(i, 17)} ${t}<span class="panel__contador">${datos[k].length}</span></button>`).join('') +
    (p.esAdmin ? `<a class="panel__opcion" href="/admin.html">${icono('admin', 17)} Administración</a>` : '');
  mostrar(location.hash.slice(1));
}

document.addEventListener('click', async (e) => {
  const s = e.target.closest('[data-seccion]');
  if (s) return mostrar(s.dataset.seccion);
  const b = e.target.closest('[data-borrar]');
  if (b && (await confirmar({ titulo: '¿Eliminar este elemento?' }))) {
    try {
      await borrar(`/${b.dataset.borrar}`);
      aviso('Eliminado');
      const actual = location.hash.slice(1);
      await cargar();
      mostrar(actual);
    } catch (er) {
      aviso(er.message, 'error');
    }
  }
});
window.addEventListener('hashchange', () => datos && mostrar(location.hash.slice(1)));

cargar();
