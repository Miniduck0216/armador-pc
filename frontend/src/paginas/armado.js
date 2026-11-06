import { montar } from '../js/layout.js';
import { api, borrar, enviar, irAIngresar } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, copiar, dinero, errorEn, esc, fecha, param } from '../js/util.js';
import { guardarPc } from '../js/estado.js';
import { listaPiezas } from './comun-configuraciones.js';

montar('armar');

async function iniciar() {
  let d;
  try {
    d = await api(`/armados/${Number(param('id'))}`);
  } catch (e) {
    if (e.estado === 401) return irAIngresar();
    $('#cabecera').innerHTML = '';
    return errorEn($('#cuerpo'), e.estado === 404 ? new Error('Este armado no existe o no es tuyo.') : e);
  }
  const { armado: a, resumen: r, diferencia } = d;
  document.title = `${a.nombre} · ArmadorPC`;
  $('#cabecera').innerHTML = `
    <div class="migas"><a href="/">Inicio</a> / <a href="/cuenta.html#armados">Mis armados</a> / ${esc(a.nombre)}</div>
    <div class="fila entre"><div><h1>${esc(a.nombre)}</h1><p>Guardado el ${fecha(a.fechaCreacion)} por ${dinero(a.precioTotal)}</p></div>
    <div class="fila"><button class="boton" id="abrir">${icono('pc', 16)} Abrir en el configurador</button><a class="boton secundario" href="/pedido.html?ids=${r.piezas.map((p) => p.id).join(',')}">${icono('lista', 16)} Lista de compra</a><button class="boton secundario" id="compartir">${icono('compartir', 16)} Compartir</button><button class="boton peligro" id="eliminar">${icono('basura', 16)} Eliminar</button></div></div>`;
  const c = r.compatibilidad;
  $('#cuerpo').innerHTML = `
    <div>${listaPiezas(r.piezas)}</div>
    <aside class="resumen-config">
      <div class="caja sombra apilado">
        <span class="antetitulo" style="margin:0">Precio de hoy</span>
        <div class="total">${dinero(r.total)}</div>
        ${diferencia ? `<div class="variacion ${diferencia < 0 ? 'baja' : 'sube'}" style="font-size:15px">${diferencia < 0 ? '▼ Bajó' : '▲ Subió'} ${dinero(Math.abs(diferencia))} desde que lo guardaste</div>` : '<div class="tenue pequeno">Mismo precio que cuando lo guardaste</div>'}
        <div class="estado-compat ${c.esCompatible ? 'ok' : 'mal'}">${icono(c.esCompatible ? 'escudo' : 'alerta', 20)} ${c.esCompatible ? 'Compatible' : `${c.errores.length} problema(s)`}</div>
        <div class="medidor"><div class="dato"><small>Consumo</small><b>${r.consumo} W</b></div><div class="dato"><small>Rendimiento</small><b>${r.rendimiento?.puntaje ?? 0}/100</b></div></div>
        ${r.rendimiento ? `<p class="pequeno"><b>${esc(r.rendimiento.nivel)}:</b> ${esc(r.rendimiento.descripcion)}</p>` : ''}
      </div>
      ${c.errores.length ? `<div class="aviso error">${c.errores.map(esc).join('<br>')}</div>` : ''}
    </aside>`;
  $('#abrir').addEventListener('click', () => {
    guardarPc(Object.fromEntries(r.piezas.map((p) => [p.categoria, p.id])));
    location.href = '/configurador.html';
  });
  $('#compartir').addEventListener('click', async () => {
    try {
      const { token } = await enviar(`/armados/${a.id}/compartir`);
      copiar(`${location.origin}/compartido.html?t=${token}`);
    } catch (e) {
      alert(e.message);
    }
  });
  $('#eliminar').addEventListener('click', async () => {
    if (!confirm('¿Eliminar este armado?')) return;
    await borrar(`/armados/${a.id}`);
    location.href = '/cuenta.html#armados';
  });
}
iniciar();
