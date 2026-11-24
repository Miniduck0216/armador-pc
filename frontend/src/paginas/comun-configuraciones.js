// "Ver componentes" de una configuración recomendada (se usa en inicio y en configuraciones)
import { dinero, esc, modal } from '../js/util.js';
import { listaPiezas } from '../js/tarjetas.js';

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
        <div class="total-modal"><span>Total de hoy (${c.cantidadPiezas} piezas)</span><strong class="total-modal__monto">${dinero(c.total)}</strong></div>
        ${c.rendimiento?.descripcion ? `<p class="texto texto--tenue texto--pequeno">${esc(c.rendimiento.descripcion)}</p>` : ''}
        <div class="total-modal__acciones">
          <a class="boton" href="/configurador.html?piezas=${c.piezas.join(',')}">Personalizar en el configurador</a>
        </div>`,
    });
  });
}
