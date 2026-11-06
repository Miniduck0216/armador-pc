import { montar } from '../js/layout.js';
import { api } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, cargando, dinero, errorEn, esc } from '../js/util.js';
import { activarTarjetas, mosaicoCategoria, tarjetaConfiguracion, tarjetaGuia, tarjetaProducto } from '../js/tarjetas.js';
import { activarVerComponentes } from './comun-configuraciones.js';

montar('');

const ACCIONES = [
  ['varita', 'Armar con el asistente', 'Indica tu presupuesto y uso; te proponemos un equipo completo.', '/configurador.html?modo=guiado'],
  ['pc', 'Elegir pieza por pieza', 'Configurador manual con compatibilidad y consumo en vivo.', '/configurador.html'],
  ['buscar', 'Buscar un componente', 'Precios de tiendas de Ecuador, historial y alertas.', '/componentes.html'],
  ['escudo', 'Comprobar compatibilidad', '¿Ya tienes piezas en mente? Revisa que encajen.', '/herramientas.html#comprobador'],
];
$('#acciones-inicio').innerHTML = ACCIONES.map(
  ([i, t, d, u]) => `<a class="tarjeta-accion" href="${u}"><span class="icono-caja">${icono(i, 22)}</span><div><h3>${t}</h3><p>${d}</p></div><span class="ir">${icono('flecha')}</span></a>`,
).join('');

const HERRAMIENTAS = [
  ['escudo', 'Comprobador de compatibilidad', 'Zócalo, memoria, tamaño de la placa y de la tarjeta gráfica, refrigeración y fuente.', '/herramientas.html#comprobador'],
  ['rayo', 'Calculadora de fuente de poder', 'Suma el consumo de cada pieza y te dice cuántos vatios comprar con margen.', '/herramientas.html#fuente'],
  ['ventilador', 'Calculadora de refrigeración', 'Según tu procesador, uso y caja: torre de aire, doble torre o líquida.', '/herramientas.html#refrigeracion'],
];
$('#herramientas').innerHTML = HERRAMIENTAS.map(
  ([i, t, d, u]) => `<a class="tarjeta-accion oscura" href="${u}"><span class="icono-caja">${icono(i, 22)}</span><div><h3>${t}</h3><p>${d}</p></div></a>`,
).join('');

cargando($('#configs'), 3, 420);
cargando($('#bajadas'), 4, 320);

async function iniciar() {
  try {
    const [inicio, configuraciones, guias] = await Promise.all([api('/inicio'), api('/configuraciones'), api('/guias')]);

    if (inicio.modoPrecios === 'demo') {
      const m = $('#modo-precios');
      m.textContent = 'Modo demostración · precios simulados';
      m.className = 'insignia';
    }
    $('#cifras').innerHTML = `
      <div><b>${inicio.cifras.tiendas}</b><small>tiendas</small></div>
      <div><b>${inicio.cifras.referencias}</b><small>modelos</small></div>
      <div><b>${inicio.cifras.ofertas}</b><small>precios hoy</small></div>`;

    const componentes = inicio.categorias.filter((c) => c.grupo !== 'periferico');
    const perifericos = inicio.categorias.filter((c) => c.grupo === 'periferico');
    $('#categorias').innerHTML = componentes.map((c) => mosaicoCategoria(c)).join('');
    $('#perifericos').innerHTML = perifericos.map((c) => mosaicoCategoria(c)).join('');

    // Tres configuraciones, con la recomendada en el centro
    const recomendada = configuraciones.find((c) => c.recomendada);
    const otras = configuraciones.filter((c) => c !== recomendada);
    const tres = recomendada ? [otras[1] ?? otras[0], recomendada, otras[3] ?? otras[2]].filter(Boolean) : configuraciones.slice(0, 3);
    $('#configs').innerHTML = tres.map(tarjetaConfiguracion).join('');
    activarVerComponentes($('#configs'), tres);

    $('#bajadas').innerHTML = inicio.bajadas.length
      ? inicio.bajadas.slice(0, 8).map((p) => tarjetaProducto(p)).join('')
      : '<div class="vacio" style="grid-column:1/-1">Aún no hay bajadas de precio registradas. Vuelve después de la próxima actualización.</div>';
    activarTarjetas($('#bajadas'), inicio.bajadas);

    $('#ranking').innerHTML = `
      <thead><tr><th>#</th><th>Procesador</th><th class="der">Puntos</th><th class="der">Precio</th></tr></thead>
      <tbody>${inicio.topProcesadores
        .map(
          (p) => `<tr><td><span class="posicion">${p.posicion}</span></td>
            <td><a href="/producto.html?id=${p.id}"><b>${esc(p.nombreCompleto)}</b></a><div class="pequeno tenue">${p.nucleos} núcleos · ${p.hilos} hilos · ${esc(p.zocalo)}</div></td>
            <td class="der"><span class="puntos">${p.puntos}</span></td><td class="der">${dinero(p.precio)}</td></tr>`,
        )
        .join('')}</tbody>`;

    $('#tiendas').innerHTML = inicio.tiendas.length
      ? inicio.tiendas
          .map(
            (t) => `<a class="fila-tienda" href="${esc(t.sitioWeb)}" target="_blank" rel="noopener">
              <span class="punto-color" style="background:${esc(t.color)}"></span><b>${esc(t.nombre)}</b>
              <span class="tenue pequeno">${t.ofertas} precios</span>${icono('externo', 15)}</a>`,
          )
          .join('') + '<p class="pequeno tenue">Los precios se actualizan automáticamente varias veces al día. Las tiendas que publican precios sin IVA se ajustan con el 15 % para que compares lo mismo.</p>'
      : '<div class="vacio">Todavía no se ha completado la primera consulta a las tiendas. Mientras tanto se muestran precios de referencia.</div>';

    $('#guias').innerHTML = guias.slice(0, 3).map(tarjetaGuia).join('');
  } catch (e) {
    errorEn($('#configs'), e);
    $('#bajadas').innerHTML = '';
  }
}
iniciar();
