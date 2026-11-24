// Sección "Reglas de compatibilidad": las reglas que usa el motor del configurador (solo lectura)
import { api } from '../../js/api.js';
import { icono } from '../../js/iconos.js';
import { esc, tabla } from '../../js/util.js';

// Nombre legible de cada tipo de comparación
const TIPOS = { igual: 'Igual', contiene: 'Contiene', menor_igual: 'Menor o igual', suma_consumo: 'Suma de consumo' };

// Un lado de la comparación: "CPU.zocalo" (la regla de la fuente compara con el consumo total)
const lado = (categoria, atributo) =>
  `<code class="reglas__codigo">${categoria ? `${esc(categoria)}${atributo ? `.${esc(atributo)}` : ''}` : 'Consumo total'}</code>`;

export default {
  titulo: 'Reglas de compatibilidad',
  icono: 'escudo',
  permiso: 'reglas.ver',

  async html() {
    const lista = await api('/admin/reglas');
    const filas = lista.map((r) => [
      `<b>${esc(r.nombre)}</b><small class="tabla__detalle">${esc(r.mensajeError)}</small>`,
      `<div class="reglas__compara">${lado(r.categoriaOrigen, r.atributoOrigen)} ${icono('flecha', 14)} ${lado(r.categoriaDestino, r.atributoDestino)}</div>`,
      [`<span class="insignia insignia--gris">${esc(TIPOS[r.tipo] ?? r.tipo)}</span>`, 'corta'],
      [r.activa ? '<span class="insignia insignia--verde">Sí</span>' : '<span class="insignia insignia--gris">No</span>', 'corta'],
    ]);
    return `<p class="texto texto--tenue panel__bloque">Reglas que usa el motor de compatibilidad del configurador.</p>
      ${tabla(['Regla', 'Compara', ['Tipo', 'corta'], ['Activa', 'corta']], filas)}`;
  },
};
