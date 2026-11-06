import { montar } from '../js/layout.js';
import { $, dinero, esc, imagen } from '../js/util.js';
import productos from '../datos/nomada.json';

montar('componentes');

// Productos de NomadaWare (tienda de accesorios). Datos tomados de nomadaware.com.ec/tiendanomada/
const enlaceSeguro = (u) => (/^https?:\/\//.test(u || '') ? esc(u) : '#');
let grupo = '';
let orden = 'nombre';
let texto = '';

function pintar() {
  const q = texto.toLowerCase();
  let lista = productos.filter((p) => (!grupo || p.grupo === grupo) && p.nombre.toLowerCase().includes(q));
  lista = [...lista].sort((a, b) =>
    orden === 'precio' ? a.precioEfectivo - b.precioEfectivo : orden === 'precioDesc' ? b.precioEfectivo - a.precioEfectivo : a.nombre.localeCompare(b.nombre),
  );
  const grupos = [...new Set(productos.map((p) => p.grupo))].sort();
  $('#grupos').innerHTML = [`<button class="chip ${grupo === '' ? 'activo' : ''}" data-grupo="">Todos (${productos.length})</button>`]
    .concat(grupos.map((g) => `<button class="chip ${grupo === g ? 'activo' : ''}" data-grupo="${esc(g)}">${esc(g)}</button>`))
    .join('');
  $('#resultados').innerHTML = lista.length
    ? lista
        .map(
          (p) => `<article class="nomada-tarjeta">
            <div class="nomada-foto">${imagen(p.imagen, p.nombre)}</div>
            <span class="antetitulo">${esc(p.grupo)}</span>
            <h3>${esc(p.nombre)}</h3>
            <div class="nomada-precios">
              <div><small>${p.precioTarjeta ? 'Efectivo' : 'Precio'}</small><b>${dinero(p.precioEfectivo)}</b></div>
              ${p.precioTarjeta ? `<div><small>Tarjeta</small><span>${dinero(p.precioTarjeta)}</span></div>` : ''}
            </div>
            ${p.enStock === false ? '<span class="tenue pequeno">Sin stock por ahora</span>' : ''}
            <a class="boton secundario ancho" href="${enlaceSeguro(p.url)}" target="_blank" rel="noopener noreferrer">Ver en NomadaWare</a>
          </article>`,
        )
        .join('')
    : '<div class="vacio">No hay productos con ese filtro.</div>';
  $('#total').textContent = `${lista.length} de ${productos.length} productos`;
}

$('#grupos').addEventListener('click', (e) => {
  const b = e.target.closest('[data-grupo]');
  if (!b) return;
  grupo = b.dataset.grupo;
  pintar();
});
$('#buscar').addEventListener('input', (e) => {
  texto = e.target.value.trim();
  pintar();
});
$('#orden').addEventListener('change', (e) => {
  orden = e.target.value;
  pintar();
});
pintar();
