// Vista de la compatibilidad (la usan el configurador, el armado, el compartido y herramientas)
import { icono } from './iconos.js';
import { esc } from './util.js';

const ICONOS = { mal: 'alerta', ok: 'escudo', pendiente: 'info' };

// Franja de color con el estado general: ok (verde), mal (rojo) o pendiente (gris)
export function estadoCompatibilidad(estado, texto) {
  return `<div class="compatibilidad__estado compatibilidad__estado--${estado}">${icono(ICONOS[estado], 20)} ${texto}</div>`;
}

// Lista de reglas: ✓ cumple, ✕ no cumple, – todavía no se puede revisar
export function listaReglas(resultados) {
  return `<ul class="compatibilidad__reglas">${resultados
    .map((x) => {
      const tipo = x.omitida ? 'omitida' : x.cumple ? 'ok' : 'mal';
      const ico = { omitida: 'menos', ok: 'check', mal: 'x' }[tipo];
      return `<li class="compatibilidad__regla"><span class="compatibilidad__icono compatibilidad__icono--${tipo}">${icono(ico, 17)}</span>
        <span>${esc(x.regla)}<small class="compatibilidad__detalle">${esc(x.detalle)}</small></span></li>`;
    })
    .join('')}</ul>`;
}
