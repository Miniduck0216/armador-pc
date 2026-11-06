import { montar } from '../js/layout.js';
import { api, borrar, enviar, irAIngresar } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, aviso, dinero, errorEn, esc, estrellas, fecha, imagen } from '../js/util.js';
import { activarTarjetas, tarjetaProducto } from '../js/tarjetas.js';

montar('');

let datos = null;
const SECCIONES = [
  ['armados', 'Mis armados', 'pc'],
  ['alertas', 'Alertas de precio', 'campana'],
  ['favoritos', 'Favoritos', 'corazon'],
  ['comparaciones', 'Comparaciones', 'comparar'],
  ['resenas', 'Mis reseñas', 'estrella'],
];

const vista = {
  armados: (d) =>
    d.armados.length
      ? `<div class="tabla-envoltura"><table class="tabla">
          <thead><tr><th>Armado</th><th>Piezas</th><th class="der">Al guardar</th><th class="der">Hoy</th><th>Estado</th><th></th></tr></thead>
          <tbody>${d.armados
            .map(
              (a) => `<tr><td><a href="/armado.html?id=${a.id}"><b>${esc(a.nombre)}</b></a><div class="pequeno tenue">${fecha(a.fechaCreacion)}</div></td>
                <td>${a.piezas}</td><td class="der">${dinero(a.precioTotal)}</td>
                <td class="der"><b>${dinero(a.precioHoy)}</b>${a.diferencia ? `<div class="variacion ${a.diferencia < 0 ? 'baja' : 'sube'}">${a.diferencia < 0 ? '▼' : '▲'} ${dinero(Math.abs(a.diferencia))}</div>` : ''}</td>
                <td>${a.esCompatible ? '<span class="insignia verde">Compatible</span>' : '<span class="insignia roja">Revisar</span>'}</td>
                <td class="der"><button class="enlace peligro" data-borrar="armados/${a.id}">Eliminar</button></td></tr>`,
            )
            .join('')}</tbody></table></div>`
      : `<div class="vacio">Todavía no guardas armados. <a href="/configurador.html">Abre el configurador</a> y pulsa «Guardar».</div>`,

  alertas: (d) =>
    d.alertas.length
      ? `<div class="apilado">${d.alertas
          .map(
            (a) => `<div class="pieza-fila" style="grid-template-columns:58px 1fr auto auto">
              ${imagen(a.componente.imagen, a.componente.nombre)}
              <span><a href="/producto.html?id=${a.componente.id}"><b>${esc(a.componente.nombre)}</b></a>
                <em>Objetivo ${dinero(a.precioObjetivo)} · hoy ${dinero(a.actual)}${a.falta ? ` · faltan ${dinero(a.falta)}` : ''}</em></span>
              ${a.disparada ? `<span class="insignia ${a.nueva ? 'amarilla' : 'verde'}">${a.nueva ? '¡Nueva! ' : ''}Alcanzó ${dinero(a.precioAlcanzado)}</span>` : '<span class="insignia gris">Esperando</span>'}
              <button class="icono-boton" data-borrar="alertas/${a.id}" title="Eliminar">${icono('basura', 16)}</button></div>`,
          )
          .join('')}</div>`
      : '<div class="vacio">No tienes alertas. Entra a cualquier componente y usa «Avísame si baja de precio».</div>',

  favoritos: (d) =>
    d.favoritos.length
      ? `<div class="grilla auto" id="favoritos">${d.favoritos.map((p) => tarjetaProducto(p)).join('')}</div>`
      : '<div class="vacio">Sin favoritos todavía. Usa el corazón en la ficha de un componente.</div>',

  comparaciones: (d) =>
    d.comparaciones.length
      ? `<div class="apilado">${d.comparaciones
          .map(
            (c) => `<div class="fila-tienda"><a href="/comparar.html?categoria=CPU&ids=${c.a.id},${c.b.id}"><b>${esc(c.a.nombre)}</b> vs <b>${esc(c.b.nombre)}</b></a>
              <span class="tenue pequeno">${fecha(c.fecha)}</span><button class="enlace peligro" data-borrar="comparaciones/${c.id}">Eliminar</button></div>`,
          )
          .join('')}</div>`
      : '<div class="vacio">Puedes guardar comparaciones de procesadores desde <a href="/comparar.html?categoria=CPU">Comparar</a>.</div>',

  resenas: (d) =>
    d.resenas.length
      ? `<div class="caja">${d.resenas
          .map(
            (r) => `<div class="resena"><div class="fila entre"><a href="/producto.html?id=${r.componente.id}"><b>${esc(r.componente.nombre)}</b></a><span class="pequeno tenue">${fecha(r.fecha)}</span></div>
              <div>${estrellas(r.calificacion)}</div><p>${esc(r.comentario)}</p><button class="enlace peligro pequeno" data-borrar="resenas/${r.id}">Eliminar</button></div>`,
          )
          .join('')}</div>`
      : '<div class="vacio">Aún no escribes reseñas.</div>',
};

function mostrar(clave) {
  if (!vista[clave]) clave = 'armados';
  document.querySelectorAll('#menu [data-seccion]').forEach((b) => b.classList.toggle('activa', b.dataset.seccion === clave));
  const [, titulo] = SECCIONES.find(([k]) => k === clave);
  $('#contenido').innerHTML = `<h2 style="margin-bottom:18px">${titulo}</h2>${vista[clave](datos)}`;
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
  $('#perfil').innerHTML = `<span class="avatar grande">${esc(p.nombre[0].toUpperCase())}</span>
    <div><h1 style="font-size:34px">${esc(p.nombre)}</h1><p class="tenue" style="margin:4px 0 0">${esc(p.correo)} · ${p.esAdmin ? 'Administrador · ' : ''}miembro desde ${fecha(p.fechaRegistro)}</p></div>
    <button class="boton secundario" id="salir" style="margin-left:auto">${icono('salir', 16)} Cerrar sesión</button>`;
  $('#salir').addEventListener('click', async () => {
    await enviar('/auth/salir');
    location.href = '/';
  });
  $('#menu').innerHTML =
    SECCIONES.map(([k, t, i]) => `<button data-seccion="${k}">${icono(i, 17)} ${t}<span class="contador">${datos[k].length}</span></button>`).join('') +
    (p.esAdmin ? `<a href="/admin.html">${icono('admin', 17)} Administración</a>` : '');
  mostrar(location.hash.slice(1));
}

document.addEventListener('click', async (e) => {
  const s = e.target.closest('[data-seccion]');
  if (s) return mostrar(s.dataset.seccion);
  const b = e.target.closest('[data-borrar]');
  if (b && confirm('¿Eliminar?')) {
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
