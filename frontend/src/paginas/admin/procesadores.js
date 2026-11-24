// Sección "Procesadores": lista con su puntaje y formulario completo de cada CPU
import { actualizar, api, borrar, enviar } from '../../js/api.js';
import { icono } from '../../js/iconos.js';
import { aviso, confirmar, dinero, esc, tabla } from '../../js/util.js';
import { campo, casilla, formularioModal } from './comun.js';

// [campo, etiqueta, tipo]. El tipo puede ser 'text', 'number', 'casilla' o una lista de opciones
const CAMPOS = [
  ['nombre', 'Modelo', 'text'], ['marca', 'Marca', ['AMD', 'Intel']], ['precio', 'Precio de referencia ($)', 'number'],
  ['zocalo', 'Zócalo', 'text'], ['nucleos', 'Núcleos', 'number'], ['hilos', 'Hilos', 'number'],
  ['frecuenciaBase', 'Frecuencia base (GHz)', 'number'], ['frecuenciaTurbo', 'Frecuencia turbo (GHz)', 'number'],
  ['cacheL3', 'Caché L3 (MB)', 'number'], ['tdp', 'TDP (W)', 'number'], ['litografia', 'Litografía (nm)', 'number'],
  ['anioLanzamiento', 'Año', 'number'], ['memoriaSoportada', 'Memoria', ['DDR4', 'DDR5', 'DDR4/DDR5']],
  ['velocidadMemoriaMax', 'Memoria máx. (MHz)', 'number'], ['versionPcie', 'PCIe', 'number'],
  ['cinebenchMono', 'Cinebench R23 mono', 'number'], ['cinebenchMulti', 'Cinebench R23 multi', 'number'],
  ['nombreGraficos', 'Gráficos integrados (nombre)', 'text'],
  ['graficosIntegrados', 'Tiene gráficos integrados', 'casilla'], ['desbloqueado', 'Multiplicador desbloqueado', 'casilla'],
];

function control(p, [k, etiqueta, tipo]) {
  const valor = (k === 'precio' ? p.precioReferencia : p[k]) ?? '';
  if (tipo === 'casilla') return casilla(etiqueta, `name="${k}" ${p[k] ? 'checked' : ''}`);
  if (Array.isArray(tipo)) return campo(etiqueta, `<select name="${k}">${tipo.map((o) => `<option ${valor === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`);
  return campo(etiqueta, `<input name="${k}" type="${tipo}" ${tipo === 'number' ? 'step="any"' : ''} value="${esc(valor)}">`);
}

function formulario(p, recargar) {
  formularioModal({
    titulo: p.id ? `Editar ${p.nombreCompleto}` : 'Nuevo procesador',
    html: `<div class="formulario__dos">${CAMPOS.map((c) => control(p, c)).join('')}</div>`,
    alEnviar: async (f) => {
      const cuerpo = {};
      for (const [k, , tipo] of CAMPOS) cuerpo[k] = tipo === 'casilla' ? f[k].checked : tipo === 'number' ? Number(f[k].value) : f[k].value.trim();
      if (p.id) await actualizar(`/admin/procesadores/${p.id}`, cuerpo, 'PUT');
      else await enviar('/admin/procesadores', cuerpo);
      aviso('Procesador guardado');
      recargar();
    },
  });
}

let lista = [];

export default {
  titulo: 'Procesadores',
  icono: 'chip',
  permiso: 'componentes.gestionar',

  async html() {
    lista = await api('/admin/procesadores');
    const filas = lista.map((p) => [
      p.posicion,
      `<a href="/producto.html?id=${p.id}"><b>${esc(p.nombreCompleto)}</b></a><small class="tabla__detalle">${p.nucleos}/${p.hilos} · ${p.tdp} W</small>`,
      esc(p.zocalo),
      [`<b class="ranking__puntos">${p.puntos}</b>`, 'derecha'],
      [dinero(p.precio), 'derecha'],
      [`<button class="enlace" data-editar="${p.id}">Editar</button> · <button class="enlace enlace--peligro" data-borrar="${p.id}">Eliminar</button>`, 'derecha corta'],
    ]);
    return `
      <div class="fila fila--entre panel__bloque"><p class="texto texto--tenue">${lista.length} procesadores. Los puntajes se recalculan al guardar.</p>
        <button class="boton boton--violeta" data-nuevo>${icono('mas', 16)} Nuevo procesador</button></div>
      ${tabla(['#', 'Procesador', 'Zócalo', ['Puntos', 'derecha'], ['Precio', 'derecha'], ''], filas)}`;
  },

  conectar(zona, { recargar }) {
    zona.addEventListener('click', async (e) => {
      if (e.target.closest('[data-nuevo]')) return formulario({}, recargar);
      const editar = e.target.closest('[data-editar]');
      if (editar) return formulario(lista.find((p) => p.id === Number(editar.dataset.editar)), recargar);
      const quitar = e.target.closest('[data-borrar]');
      if (quitar && (await confirmar({ titulo: '¿Eliminar este procesador?', mensaje: 'También se borran sus precios y reseñas. No se puede deshacer.' }))) {
        await borrar(`/admin/procesadores/${quitar.dataset.borrar}`).catch((er) => aviso(er.message, 'error'));
        recargar();
      }
    });
  },
};
