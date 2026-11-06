import { montar } from '../js/layout.js';
import { api } from '../js/api.js';
import { $, $$, cargando, errorEn } from '../js/util.js';
import { tarjetaConfiguracion } from '../js/tarjetas.js';
import { activarVerComponentes } from './comun-configuraciones.js';

montar('armar');

let todas = [];
const lista = $('#lista');

function pintar(uso) {
  $$('#pestanas button').forEach((b) => b.classList.toggle('activa', b.dataset.uso === uso));
  const visibles = uso ? todas.filter((c) => c.uso === uso) : todas;
  lista.innerHTML = visibles.length ? visibles.map(tarjetaConfiguracion).join('') : '<div class="vacio" style="grid-column:1/-1">No hay configuraciones en esta categoría.</div>';
  history.replaceState(null, '', uso ? `?uso=${uso}` : location.pathname);
}

$('#pestanas').addEventListener('click', (e) => {
  const b = e.target.closest('[data-uso]');
  if (b) pintar(b.dataset.uso);
});

cargando(lista, 3, 460);
api('/configuraciones')
  .then((c) => {
    todas = c;
    activarVerComponentes(lista, todas);
    pintar(new URLSearchParams(location.search).get('uso') ?? '');
  })
  .catch((e) => errorEn(lista, e));
