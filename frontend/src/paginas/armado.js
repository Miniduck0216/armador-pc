import { montar } from '../js/layout.js';
import { api, borrar, enviar, irAIngresar } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, aviso, confirmar, copiar, dinero, errorEn, errorFormulario, esc, fecha, modal, param } from '../js/util.js';
import { estadoCompatibilidad } from '../js/compatibilidad.js';
import { guardarPc } from '../js/estado.js';
import { empezarEdicion } from '../js/edicion.js';
import { listaPiezas } from '../js/tarjetas.js';

montar('armar');

// Textos de cada acción del flujo de revisión
const ACCIONES = {
  enviar: { boton: 'Enviar a revisión', titulo: 'Enviar a revisión', ayuda: 'Un técnico revisará tu armado. Puedes dejarle un comentario (opcional).', motivo: false, clase: 'boton--violeta', icono: 'flecha' },
  tomar: { boton: 'Tomar revisión', titulo: 'Tomar revisión', ayuda: 'Quedarás como el técnico a cargo de este armado.', motivo: false, clase: 'boton--violeta', icono: 'check' },
  aprobar: { boton: 'Aprobar', titulo: 'Aprobar armado', ayuda: 'Comentario para el usuario (opcional).', motivo: false, clase: 'boton--violeta', icono: 'check' },
  devolver: { boton: 'Devolver para corregir', titulo: 'Devolver para corregir', ayuda: 'Explica qué debe cambiar el usuario (obligatorio).', motivo: true, clase: 'boton--secundario', icono: 'actualizar' },
  rechazar: { boton: 'Rechazar', titulo: 'Rechazar armado', ayuda: 'Explica por qué se rechaza (obligatorio).', motivo: true, clase: 'boton--peligro', icono: 'x' },
};

const botonAccion = (accion) => {
  const a = ACCIONES[accion];
  return `<button class="boton ${a.clase}" data-accion="${accion}">${icono(a.icono, 16)} ${a.boton}</button>`;
};

function historialHtml(historial) {
  if (!historial.length) return '<p class="texto texto--tenue texto--pequeno">Este armado todavía no se envió a revisión.</p>';
  return `<ol class="historial-flujo">${historial
    .map((h) => `<li class="historial-flujo__paso historial-flujo__paso--${h.estadoNuevo}">
      <span class="historial-flujo__estado">${esc(h.a)}</span>
      <span class="historial-flujo__quien">${esc(h.usuario)} · ${fecha(h.fecha, true)}</span>
      ${h.comentario ? `<span class="historial-flujo__comentario">“${esc(h.comentario)}”</span>` : ''}</li>`)
    .join('')}</ol>`;
}

async function iniciar() {
  let d;
  try {
    d = await api(`/armados/${Number(param('id'))}`);
  } catch (e) {
    if (e.estado === 401) return irAIngresar();
    $('#cabecera').innerHTML = '';
    return errorEn($('#cuerpo'), e.estado === 404 ? new Error('Este armado no existe o no es tuyo.') : e);
  }
  const { armado: a, resumen: r, diferencia, puede, historial } = d;
  const ids = r.piezas.map((p) => p.id);
  document.title = `${a.nombre} · ArmadorPC`;

  const acciones = [
    puede.enviar ? botonAccion('enviar') : '',
    puede.tomar ? botonAccion('tomar') : '',
    ...(puede.decidir ? ['aprobar', 'devolver', 'rechazar'].map(botonAccion) : []),
  ].join('');

  const migaAnterior = puede.compartir
    ? '<a class="cabecera-pagina__miga" href="/cuenta.html#armados">Mis armados</a>'
    : '<a class="cabecera-pagina__miga" href="/admin.html#revisiones">Revisión de armados</a>';
  const botones = [
    puede.editar
      ? `<button class="boton" id="editar">${icono('pc', 16)} Editar piezas</button>`
      : `<button class="boton boton--secundario" id="abrir">${icono('pc', 16)} Abrir en el configurador</button>`,
    `<a class="boton boton--secundario" href="/pedido.html?ids=${ids.join(',')}">${icono('lista', 16)} Lista de compra</a>`,
    puede.compartir ? `<button class="boton boton--secundario" id="compartir">${icono('compartir', 16)} Compartir</button>` : '',
    puede.eliminar ? `<button class="boton boton--peligro" id="eliminar">${icono('basura', 16)} Eliminar</button>` : '',
  ].join('');

  $('#cabecera').innerHTML = `
    <div class="cabecera-pagina__migas"><a class="cabecera-pagina__miga" href="/">Inicio</a> / ${migaAnterior} / ${esc(a.nombre)}</div>
    <div class="fila fila--entre">
      <div><h1>${esc(a.nombre)}</h1>
        <p class="cabecera-pagina__texto">Guardado el ${fecha(a.fechaCreacion)} por ${dinero(a.precioTotal)}${puede.compartir ? '' : ` · de ${esc(a.dueno ?? '')}`}</p>
        <span class="estado-armado estado-armado--${a.estado}">${esc(a.nombreEstado)}</span>
        ${a.revisor ? `<span class="texto texto--tenue texto--pequeno"> · Revisa: ${esc(a.revisor)}</span>` : ''}
      </div>
      <div class="cabecera-pagina__acciones">${botones}</div>
    </div>
    ${acciones ? `<div class="flujo-acciones">${acciones}</div>` : ''}
    ${a.motivo ? `<div class="aviso ${a.estado === 'rechazado' ? 'aviso--error' : 'aviso--alerta'} flujo-acciones__motivo"><b>Motivo del técnico:</b> ${esc(a.motivo)}</div>` : ''}`;

  const c = r.compatibilidad;
  const cambio = diferencia
    ? `<div class="variacion variacion--${diferencia < 0 ? 'baja' : 'sube'} resumen-armado__cambio">${diferencia < 0 ? '▼ Bajó' : '▲ Subió'} ${dinero(Math.abs(diferencia))} desde que lo guardaste</div>`
    : '<div class="texto texto--tenue texto--pequeno">Mismo precio que cuando lo guardaste</div>';
  $('#cuerpo').innerHTML = `
    <div>${listaPiezas(r.piezas)}</div>
    <aside class="resumen-armado">
      <div class="caja caja--sombra caja--pila">
        <span class="seccion__antetitulo resumen-armado__etiqueta">Precio de hoy</span>
        <div class="resumen-armado__total">${dinero(r.total)}</div>
        ${cambio}
        ${estadoCompatibilidad(c.esCompatible ? 'ok' : 'mal', c.esCompatible ? 'Compatible' : `${c.errores.length} problema(s)`)}
        <div class="datos datos--dos">
          <div class="datos__dato"><small class="datos__etiqueta">Consumo</small><b class="datos__valor">${r.consumo} W</b></div>
          <div class="datos__dato"><small class="datos__etiqueta">Rendimiento</small><b class="datos__valor">${r.rendimiento?.puntaje ?? 0}/100</b></div>
        </div>
        ${r.rendimiento ? `<p class="texto texto--pequeno"><b>${esc(r.rendimiento.nivel)}:</b> ${esc(r.rendimiento.descripcion)}</p>` : ''}
      </div>
      ${c.errores.length ? `<div class="aviso aviso--error">${c.errores.map(esc).join('<br>')}</div>` : ''}
      <div class="caja"><h4 class="resumen-armado__titulo">Historial de revisión</h4>${historialHtml(historial)}</div>
    </aside>`;

  $('#abrir')?.addEventListener('click', () => {
    guardarPc(Object.fromEntries(r.piezas.map((p) => [p.categoria, p.id])));
    location.href = '/configurador.html';
  });
  $('#editar')?.addEventListener('click', () => {
    // Abre el configurador con estas piezas; al guardar se actualiza este mismo armado
    guardarPc(Object.fromEntries(r.piezas.map((p) => [p.categoria, p.id])));
    empezarEdicion(a.id, a.nombre);
    location.href = '/configurador.html';
  });
  $('#compartir')?.addEventListener('click', async () => {
    try {
      const { token } = await enviar(`/armados/${a.id}/compartir`);
      copiar(`${location.origin}/compartido.html?t=${token}`);
    } catch (e) {
      aviso(e.message, 'error');
    }
  });
  $('#eliminar')?.addEventListener('click', async () => {
    if (!(await confirmar({ titulo: '¿Eliminar este armado?', mensaje: `Se borrará «${a.nombre}» y su historial de revisión. No se puede deshacer.` }))) return;
    try {
      await borrar(`/armados/${a.id}`);
      location.href = '/cuenta.html#armados';
    } catch (e) {
      aviso(e.message, 'error');
    }
  });
  document.querySelectorAll('[data-accion]').forEach((b) => b.addEventListener('click', () => pedirAccion(a.id, b.dataset.accion)));
}

// Ventana para confirmar una acción del flujo (con comentario o motivo)
function pedirAccion(id, accion) {
  const a = ACCIONES[accion];
  const m = modal({
    titulo: a.titulo,
    ancho: 520,
    contenido: `<form class="formulario">
      <div class="aviso aviso--error" id="err-flujo" hidden></div>
      <label class="formulario__campo"><span class="formulario__etiqueta">${a.motivo ? 'Motivo' : 'Comentario'}</span>
        <textarea name="comentario" rows="3" maxlength="300" ${a.motivo ? 'required minlength="5"' : ''}></textarea></label>
      <p class="formulario__ayuda">${a.ayuda}</p>
      <button class="boton ${a.clase === 'boton--peligro' ? 'boton--peligro' : 'boton--violeta'}">${a.boton}</button>
    </form>`,
  });
  m.cuerpo.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const r = await enviar(`/armados/${id}/flujo`, { accion, comentario: e.target.comentario.value.trim() });
      m.cerrar();
      aviso(`Estado: ${r.nombreEstado}`);
      iniciar();
    } catch (er) {
      errorFormulario(m.cuerpo.querySelector('#err-flujo'), er.message);
    }
  });
}

iniciar();
