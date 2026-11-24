import { montar } from '../js/layout.js';
import { api } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, cargando, dinero, errorEn, esc, tabla } from '../js/util.js';
import { activarTarjetas, mosaicoCategoria, tarjetaConfiguracion, tarjetaGuia, tarjetaProducto } from '../js/tarjetas.js';
import { activarVerComponentes } from './comun-configuraciones.js';

montar('');

const ACCIONES = [
  ['varita', 'Armar con el asistente', 'Indica tu presupuesto y uso; te proponemos un equipo completo.', '/configurador.html?modo=guiado'],
  ['pc', 'Elegir pieza por pieza', 'Configurador manual con compatibilidad y consumo en vivo.', '/configurador.html'],
  ['buscar', 'Buscar un componente', 'Precios de tiendas de Ecuador, historial y alertas.', '/componentes.html'],
  ['escudo', 'Comprobar compatibilidad', '¿Ya tienes piezas en mente? Revisa que encajen.', '/herramientas.html#comprobador'],
];
// Tarjeta con ícono, título y texto que lleva a otra página
const tarjetaAccion = ([i, t, d, u], modificador = '', flecha = false) =>
  `<a class="tarjeta-accion ${modificador}" href="${u}"><span class="tarjeta-accion__icono">${icono(i, 22)}</span>
    <div><h3 class="tarjeta-accion__titulo">${t}</h3><p class="tarjeta-accion__texto">${d}</p></div>
    ${flecha ? `<span class="tarjeta-accion__flecha">${icono('flecha')}</span>` : ''}</a>`;

$('#acciones-inicio').innerHTML = ACCIONES.map((a) => tarjetaAccion(a, 'tarjeta-accion--compacta', true)).join('');

const HERRAMIENTAS = [
  ['escudo', 'Comprobador de compatibilidad', 'Zócalo, memoria, tamaño de la placa y de la tarjeta gráfica, refrigeración y fuente.', '/herramientas.html#comprobador'],
  ['rayo', 'Calculadora de fuente de poder', 'Suma el consumo de cada pieza y te dice cuántos vatios comprar con margen.', '/herramientas.html#fuente'],
  ['ventilador', 'Calculadora de refrigeración', 'Según tu procesador, uso y caja: torre de aire, doble torre o líquida.', '/herramientas.html#refrigeracion'],
];
$('#herramientas').innerHTML = HERRAMIENTAS.map((h) => tarjetaAccion(h, 'tarjeta-accion--oscura')).join('');

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
    const { tiendas, referencias, ofertas } = inicio.cifras;
    $('#cifras').innerHTML = [[tiendas, 'tiendas'], [referencias, 'modelos'], [ofertas, 'precios hoy']]
      .map(([n, t]) => `<div class="heroe__cifra"><b class="heroe__numero">${n}</b><small class="heroe__etiqueta">${t}</small></div>`)
      .join('');

    const componentes = inicio.categorias.filter((c) => c.grupo !== 'periferico');
    const perifericos = inicio.categorias.filter((c) => c.grupo === 'periferico');
    $('#categorias').innerHTML = componentes.map((c) => mosaicoCategoria(c)).join('');
    $('#perifericos').innerHTML = perifericos.map((c) => mosaicoCategoria(c, { modificador: 'mosaico--compacto' })).join('');

    // Tres configuraciones, con la recomendada en el centro
    const recomendada = configuraciones.find((c) => c.recomendada);
    const otras = configuraciones.filter((c) => c !== recomendada);
    const tres = recomendada ? [otras[1] ?? otras[0], recomendada, otras[3] ?? otras[2]].filter(Boolean) : configuraciones.slice(0, 3);
    $('#configs').innerHTML = tres.map(tarjetaConfiguracion).join('');
    activarVerComponentes($('#configs'), tres);

    $('#bajadas').innerHTML = inicio.bajadas.length
      ? inicio.bajadas.slice(0, 8).map((p) => tarjetaProducto(p)).join('')
      : '<div class="vacio">Aún no hay bajadas de precio registradas. Vuelve después de la próxima actualización.</div>';
    activarTarjetas($('#bajadas'), inicio.bajadas);

    $('#ranking').innerHTML = tabla(
      ['#', 'Procesador', ['Puntos', 'derecha'], ['Precio', 'derecha']],
      inicio.topProcesadores.map((p) => [
        `<span class="ranking__posicion">${p.posicion}</span>`,
        `<a href="/producto.html?id=${p.id}"><b>${esc(p.nombreCompleto)}</b></a><small class="tabla__detalle">${p.nucleos} núcleos · ${p.hilos} hilos · ${esc(p.zocalo)}</small>`,
        [`<span class="ranking__puntos">${p.puntos}</span>`, 'derecha'],
        [dinero(p.precio), 'derecha'],
      ]),
    );

    $('#tiendas').innerHTML = inicio.tiendas.length
      ? inicio.tiendas
          .map(
            (t) => `<a class="tienda-fila" href="${esc(t.sitioWeb)}" target="_blank" rel="noopener">
              <span class="tienda-fila__color" style="background:${esc(t.color)}"></span><b>${esc(t.nombre)}</b>
              <span class="tienda-fila__cantidad">${t.ofertas} precios</span>${icono('externo', 15)}</a>`,
          )
          .join('') + '<p class="texto texto--pequeno texto--tenue">Los precios se actualizan automáticamente varias veces al día. Las tiendas que publican precios sin IVA se ajustan con el 15 % para que compares lo mismo.</p>'
      : '<div class="vacio">Todavía no se ha completado la primera consulta a las tiendas. Mientras tanto se muestran precios de referencia.</div>';

    $('#guias').innerHTML = guias.slice(0, 3).map(tarjetaGuia).join('');
  } catch (e) {
    errorEn($('#configs'), e);
    $('#bajadas').innerHTML = '';
  }
}
iniciar();
