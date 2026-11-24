// Sección "Reportes": datos incorrectos que avisan los usuarios
import { actualizar, api } from '../../js/api.js';
import { esc, fecha, tabla } from '../../js/util.js';

export default {
  titulo: 'Reportes',
  icono: 'bandera',
  permiso: 'reportes.gestionar',

  async html() {
    const lista = await api('/admin/reportes');
    const filas = lista.map((r) => {
      const pendiente = r.estado === 'pendiente';
      return [
        `<a href="/producto.html?id=${r.componente.id}">${esc(r.componente.nombre)}</a><small class="tabla__detalle">${fecha(r.fecha)}</small>`,
        esc(r.mensaje),
        esc(r.usuario ?? '—'),
        pendiente ? '<span class="insignia insignia--amarilla">Pendiente</span>' : '<span class="insignia insignia--verde">Resuelto</span>',
        pendiente ? `<button class="boton boton--pequeno boton--secundario" data-resolver="${r.id}">Marcar resuelto</button>` : '',
      ];
    });
    return tabla(['Componente', 'Mensaje', 'Usuario', 'Estado', ''], filas, { vacio: 'No hay reportes.' });
  },

  conectar(zona, { recargar }) {
    zona.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-resolver]');
      if (!b) return;
      await actualizar(`/admin/reportes/${b.dataset.resolver}/resolver`);
      recargar();
    });
  },
};
