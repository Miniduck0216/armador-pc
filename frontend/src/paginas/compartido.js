import { montar } from '../js/layout.js';
import { api } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, dinero, errorEn, esc, fecha, param } from '../js/util.js';
import { guardarPc } from '../js/estado.js';
import { listaPiezas } from '../js/tarjetas.js';
import { estadoCompatibilidad } from '../js/compatibilidad.js';

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
    <div class="cabecera-pagina__migas"><a class="cabecera-pagina__miga" href="/">Inicio</a> / Armado compartido</div>
    <h1>${esc(a.nombre)}</h1>
    <p class="cabecera-pagina__texto">Armado el ${fecha(a.fechaCreacion)} · precio guardado ${dinero(a.precioGuardado)}</p>`;
  const c = r.compatibilidad;
  const cambio = diferencia
    ? `<div class="variacion variacion--${diferencia < 0 ? 'baja' : 'sube'} resumen-armado__cambio">${diferencia < 0 ? '▼ Bajó' : '▲ Subió'} ${dinero(Math.abs(diferencia))} desde que se guardó</div>`
    : '<div class="texto texto--tenue texto--pequeno">Mismo precio que cuando se guardó</div>';
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
        <div class="pila pila--chica">
          <a class="boton boton--violeta" href="/pedido.html?ids=${ids.join(',')}">${icono('lista', 16)} Ver lista de compra</a>
          <a class="boton boton--secundario" href="/configurador.html" id="abrir-config">${icono('pc', 16)} Editar en mi configurador</a>
        </div>
      </div>
    </aside>`;
  $('#abrir-config').addEventListener('click', () => guardarPc(Object.fromEntries(r.piezas.map((p) => [p.categoria, p.id]))));
}
iniciar();
