import { montar } from '../js/layout.js';
import { api } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, dinero, errorEn, esc, fecha, param } from '../js/util.js';
import { guardarPc } from '../js/estado.js';
import { listaPiezas } from './comun-configuraciones.js';

montar('armar');

// Vista pública de un armado que alguien compartió (sin iniciar sesión)
async function iniciar() {
  let d;
  try {
    d = await api(`/compartidos/${encodeURIComponent(param('t') ?? '')}`);
  } catch (e) {
    $('#cabecera').innerHTML = '<h1>Armado compartido</h1>';
    return errorEn($('#cuerpo'), e);
  }
  const { armado: a, resumen: r, diferencia } = d;
  const ids = r.piezas.map((p) => p.id);
  document.title = `${a.nombre} · ArmadorPC`;
  $('#cabecera').innerHTML = `
    <div class="migas"><a href="/">Inicio</a> / Armado compartido</div>
    <h1>${esc(a.nombre)}</h1>
    <p>Armado el ${fecha(a.fechaCreacion)} · precio guardado ${dinero(a.precioGuardado)}</p>`;
  const c = r.compatibilidad;
  $('#cuerpo').innerHTML = `
    <div>${listaPiezas(r.piezas)}</div>
    <aside class="resumen-config">
      <div class="caja sombra apilado">
        <span class="antetitulo" style="margin:0">Precio de hoy</span>
        <div class="total">${dinero(r.total)}</div>
        ${diferencia ? `<div class="variacion ${diferencia < 0 ? 'baja' : 'sube'}" style="font-size:15px">${diferencia < 0 ? '▼ Bajó' : '▲ Subió'} ${dinero(Math.abs(diferencia))} desde que se guardó</div>` : '<div class="tenue pequeno">Mismo precio que cuando se guardó</div>'}
        <div class="estado-compat ${c.esCompatible ? 'ok' : 'mal'}">${icono(c.esCompatible ? 'escudo' : 'alerta', 20)} ${c.esCompatible ? 'Compatible' : `${c.errores.length} problema(s)`}</div>
        <div class="medidor"><div class="dato"><small>Consumo</small><b>${r.consumo} W</b></div><div class="dato"><small>Rendimiento</small><b>${r.rendimiento?.puntaje ?? 0}/100</b></div></div>
        <div class="pedido-acciones">
          <a class="boton violeta" href="/pedido.html?ids=${ids.join(',')}">${icono('lista', 16)} Ver lista de compra</a>
          <a class="boton secundario" href="/configurador.html" id="abrir-config">${icono('pc', 16)} Editar en mi configurador</a>
        </div>
      </div>
    </aside>`;
  $('#abrir-config').addEventListener('click', () => guardarPc(Object.fromEntries(r.piezas.map((p) => [p.categoria, p.id]))));
}
iniciar();
