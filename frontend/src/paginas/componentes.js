import { montar } from '../js/layout.js';
import { api, consulta } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, cargando, errorEn, esc, retrasar } from '../js/util.js';
import { activarTarjetas, mosaicoCategoria, tarjetaProducto } from '../js/tarjetas.js';

montar('componentes');

const url = new URLSearchParams(location.search);
const filtros = {
  categoria: url.get('categoria') ?? '',
  buscar: url.get('buscar') ?? '',
  marca: url.get('marca') ?? '',
  gama: url.get('gama') ?? '',
  precioMin: url.get('precioMin') ?? '',
  precioMax: url.get('precioMax') ?? '',
  enStock: url.get('enStock') === 'true',
  orden: url.get('orden') ?? 'relevancia',
  pagina: Number(url.get('pagina') ?? 1),
};
let categorias = [];

// Refleja los filtros en la dirección (se puede compartir o volver atrás)
function sincronizarUrl() {
  const q = consulta({ ...filtros, pagina: filtros.pagina > 1 ? filtros.pagina : '', orden: filtros.orden !== 'relevancia' ? filtros.orden : '' });
  history.replaceState(null, '', `${location.pathname}${q}`);
}

function pintarCabecera() {
  const c = categorias.find((x) => x.codigo === filtros.categoria);
  $('#titulo').textContent = c ? c.plural : filtros.orden === 'bajada' ? 'Bajadas de precio' : 'Biblioteca de componentes';
  $('#miga').innerHTML = c ? `<a class="cabecera-pagina__miga" href="/componentes.html">Componentes</a> / ${esc(c.plural)}` : 'Componentes';
  $('#descripcion').textContent = c?.descripcion ?? 'Busca, filtra y compara piezas con el mejor precio de hoy en tiendas de Ecuador.';
  document.title = `${c ? c.plural : 'Componentes'} · ArmadorPC`;
  const qm = $('#que-mirar');
  if (c?.queMirar) {
    qm.innerHTML = `${icono('info', 20)}<div><b>Qué mirar al elegir ${esc(c.nombre.toLowerCase())}:</b> ${esc(c.queMirar)}</div>`;
  }
  qm.hidden = !c?.queMirar;
  const total = categorias.reduce((suma, x) => suma + x.referencias, 0);
  const todas = `<a class="mosaico mosaico--compacto mosaico--todas ${filtros.categoria ? '' : 'mosaico--activo'}" href="/componentes.html" data-cat="">
      <span class="mosaico__velo"></span><span class="mosaico__texto"><b class="mosaico__titulo">Todas</b><small class="mosaico__detalle">${total} modelos</small></span></a>`;
  $('#categorias').innerHTML =
    todas +
    categorias
      .map((x) =>
        mosaicoCategoria(x, {
          modificador: `mosaico--compacto ${x.codigo === filtros.categoria ? 'mosaico--activo' : ''}`,
          atributos: `data-cat="${x.codigo}"`,
        }),
      )
      .join('');
}

function casillas(el, valores, seleccion, clave) {
  const elegidos = seleccion ? seleccion.split(',') : [];
  el.innerHTML = valores.length
    ? valores.map((v) => `<label class="formulario__casilla"><input type="checkbox" value="${esc(v)}" ${elegidos.includes(String(v)) ? 'checked' : ''}> ${esc(v)}</label>`).join('')
    : '<span class="texto texto--pequeno texto--tenue">—</span>';
  el.onchange = () => {
    filtros[clave] = [...el.querySelectorAll('input:checked')].map((i) => i.value).join(',');
    filtros.pagina = 1;
    cargar();
  };
}

async function cargar() {
  sincronizarUrl();
  pintarCabecera();
  const res = $('#resultados');
  res.classList.add('grilla--cargando');
  if (!res.children.length) cargando(res, 8, 340);
  try {
    const datos = await api(`/componentes${consulta({ ...filtros, limite: 24 })}`);
    $('#conteo').textContent = `${datos.total} ${datos.total === 1 ? 'resultado' : 'resultados'}`;
    casillas($('#f-marcas'), datos.facetas.marcas, filtros.marca, 'marca');
    casillas($('#f-gamas'), datos.facetas.gamas, filtros.gama, 'gama');
    res.innerHTML = datos.resultados.length
      ? datos.resultados.map((p) => tarjetaProducto(p)).join('')
      : `<div class="vacio">No encontramos componentes con esos filtros. <button class="enlace" id="vacio-limpiar">Limpiar filtros</button></div>`;
    $('#vacio-limpiar')?.addEventListener('click', limpiar);
    activarTarjetas(res, datos.resultados);
    $('#paginacion').innerHTML =
      datos.paginas > 1
        ? Array.from(
            { length: datos.paginas },
            (_, i) => `<button class="paginacion__boton ${i + 1 === datos.pagina ? 'paginacion__boton--activa' : ''}" data-pagina="${i + 1}">${i + 1}</button>`,
          ).join('')
        : '';
  } catch (e) {
    errorEn(res, e);
  } finally {
    res.classList.remove('grilla--cargando');
  }
}

function limpiar() {
  Object.assign(filtros, { buscar: '', marca: '', gama: '', precioMin: '', precioMax: '', enStock: false, pagina: 1 });
  $('#f-buscar').value = $('#f-min').value = $('#f-max').value = '';
  $('#f-stock').checked = false;
  cargar();
}

// Controles
$('#f-buscar').value = filtros.buscar;
$('#f-min').value = filtros.precioMin;
$('#f-max').value = filtros.precioMax;
$('#f-stock').checked = filtros.enStock;
$('#f-orden').value = filtros.orden;
const alEscribir = retrasar(() => {
  filtros.buscar = $('#f-buscar').value.trim();
  filtros.precioMin = $('#f-min').value;
  filtros.precioMax = $('#f-max').value;
  filtros.pagina = 1;
  cargar();
}, 350);
['#f-buscar', '#f-min', '#f-max'].forEach((s) => $(s).addEventListener('input', alEscribir));
$('#f-stock').addEventListener('change', (e) => {
  filtros.enStock = e.target.checked;
  filtros.pagina = 1;
  cargar();
});
$('#f-orden').addEventListener('change', (e) => {
  filtros.orden = e.target.value;
  filtros.pagina = 1;
  cargar();
});
$('#limpiar').addEventListener('click', limpiar);
$('#ver-filtros').addEventListener('click', () => $('#filtros').classList.toggle('biblioteca__filtros--abiertos'));
$('#paginacion').addEventListener('click', (e) => {
  const b = e.target.closest('[data-pagina]');
  if (!b) return;
  filtros.pagina = Number(b.dataset.pagina);
  cargar();
  window.scrollTo({ top: $('.biblioteca').offsetTop - 90, behavior: 'smooth' });
});
// Cambiar de categoría sin recargar la página
$('#categorias').addEventListener('click', (e) => {
  const a = e.target.closest('[data-cat]');
  if (!a) return;
  e.preventDefault();
  Object.assign(filtros, { categoria: a.dataset.cat, marca: '', gama: '', pagina: 1 });
  $('#resultados').innerHTML = '';
  cargar();
});

api('/categorias')
  .then((c) => (categorias = c))
  .catch(() => [])
  .finally(cargar);
