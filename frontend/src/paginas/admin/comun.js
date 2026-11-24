// Piezas que comparten todas las secciones del panel de administración
import { errorFormulario, modal } from '../../js/util.js';

// Campo con su etiqueta (bloque "formulario")
export const campo = (etiqueta, control) =>
  `<label class="formulario__campo"><span class="formulario__etiqueta">${etiqueta}</span>${control}</label>`;

// Casilla con su texto
export const casilla = (texto, atributos) => `<label class="formulario__casilla"><input type="checkbox" ${atributos}> ${texto}</label>`;

// Interruptor (switch) para activar o desactivar algo de una tabla
export const interruptor = (atributos) =>
  `<label class="interruptor"><input class="interruptor__entrada" type="checkbox" ${atributos}><span class="interruptor__deslizador"></span></label>`;

// Opciones de un <select>: lista de [valor, texto] y el valor elegido
export const opciones = (lista, elegido) =>
  lista.map(([valor, texto]) => `<option value="${valor}" ${String(valor) === String(elegido) ? 'selected' : ''}>${texto}</option>`).join('');

// Formulario dentro de una ventana. Si el servidor responde con error, el mensaje se
// muestra arriba del formulario y la ventana queda abierta para corregir.
export function formularioModal({ titulo, ancho = 620, html, boton = 'Guardar', alEnviar }) {
  const m = modal({
    titulo,
    ancho,
    contenido: `<form class="formulario"><div class="aviso aviso--error" data-error hidden></div>${html}
      <button class="boton boton--violeta">${boton}</button></form>`,
  });
  const form = m.cuerpo.querySelector('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await alEnviar(form);
      m.cerrar();
    } catch (er) {
      errorFormulario(form.querySelector('[data-error]'), er.message);
    }
  });
  return form;
}
