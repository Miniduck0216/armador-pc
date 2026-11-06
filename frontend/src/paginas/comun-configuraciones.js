// "Ver componentes" de una configuración recomendada (se usa en inicio y en configuraciones)
import { dinero, esc, imagen, modal } from '../js/util.js';

export function listaPiezas(piezas) {
  return `<div class="lista-piezas">${piezas
    .map(
      (p) => `<a class="pieza-fila" href="/producto.html?id=${p.id}">
        ${imagen(p.imagen, p.nombre)}
        <span><small>${esc(p.categoriaNombre)}</small><b>${esc(p.nombre)}</b>
        ${p.tienda && p.tieneOfertas !== false ? `<em>en <i style="color:${esc(p.tienda.color)}">${esc(p.tienda.nombre)}</i>${p.enStock ? '' : ' · sin stock'}</em>` : '<em>Precio de referencia</em>'}</span>
        <strong>${dinero(p.precio)}</strong></a>`,
    )
    .join('')}</div>`;
}

export function activarVerComponentes(contenedor, configuraciones) {
  contenedor.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ver]');
    if (!b) return;
    const c = configuraciones.find((x) => x.slug === b.dataset.ver);
    if (!c) return;
    modal({
      titulo: c.titulo,
      contenido: `
        ${listaPiezas(c.piezasDetalle ?? [])}
        <div class="total-modal"><span>Total de hoy (${c.cantidadPiezas} piezas)</span><strong>${dinero(c.total)}</strong></div>
        ${c.rendimiento?.descripcion ? `<p class="tenue pequeno">${esc(c.rendimiento.descripcion)}</p>` : ''}
        <div class="fila" style="margin-top:14px;justify-content:flex-end">
          <a class="boton" href="/configurador.html?piezas=${c.piezas.join(',')}">Personalizar en el configurador</a>
        </div>`,
    });
  });
}
