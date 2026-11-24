// Sección "Revisión de armados": bandeja del técnico con los armados enviados o en revisión
import { api } from '../../js/api.js';
import { dinero, esc, hace, tabla } from '../../js/util.js';

export default {
  titulo: 'Revisión de armados',
  icono: 'check',
  permiso: 'armados.revisar',

  async html() {
    const lista = await api('/revisiones');
    const filas = lista.map((a) => [
      `<b>${esc(a.nombre)}</b><small class="tabla__detalle">${a.piezas} pieza(s) · ${hace(a.fechaEstado)}</small>`,
      esc(a.dueno ?? ''),
      [dinero(a.precioTotal), 'derecha'],
      `<span class="estado-armado estado-armado--${a.estado}">${esc(a.nombreEstado)}</span>`,
      `<span class="texto texto--pequeno">${a.revisor ? esc(a.revisor) + (a.esMio ? ' (tú)' : '') : '—'}</span>`,
      [`<a class="boton boton--pequeno" href="/armado.html?id=${a.id}">${a.estado === 'enviado' ? 'Revisar' : 'Abrir'}</a>`, 'derecha'],
    ]);
    return tabla(['Armado', 'Usuario', ['Total', 'derecha'], 'Estado', 'Revisor', ''], filas, { vacio: 'No hay armados esperando revisión.' });
  },
};
