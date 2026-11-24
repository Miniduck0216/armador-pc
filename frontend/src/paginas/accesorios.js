import { montar } from '../js/layout.js';
import { $, dinero, esc, imagen } from '../js/util.js';
import productos from '../datos/nomada.json';

montar('componentes');

// Productos de NomadaWare (tienda de accesorios). Datos tomados de nomadaware.com.ec/tiendanomada/
const enlaceSeguro = (u) => (/^https?:\/\//.test(u || '') ? esc(u) : '#');
let grupo = '';
let orden = 'nombre';
let texto = '';

// Tarjeta de un accesorio con su foto, grupo y precios
function tarjeta(p) {
  const tarjetaPrecio = p.precioTarjeta ? `<div><small class="accesorio__nota">Tarjeta</small><span class="accesorio__secundario">${dinero(p.precioTarjeta)}</span></div>` : '';
  return `<article class="accesorio">
      <div class="accesorio__foto">${imagen(p.imagen, p.nombre, 'accesorio__imagen')}</div>
      <span class="seccion__antetitulo">${esc(p.grupo)}</span>
      <h3 class="accesorio__nombre">${esc(p.nombre)}</h3>
      <div class="accesorio__precios">
        <div><small class="accesorio__nota">${p.precioTarjeta ? 'Efectivo' : 'Precio'}</small><b class="accesorio__precio">${dinero(p.precioEfectivo)}</b></div>
        ${tarjetaPrecio}
      </div>
      ${p.enStock === false ? '<span class="texto texto--tenue texto--pequeno">Sin stock por ahora</span>' : ''}
      <a class="boton boton--secundario boton--ancho" href="${enlaceSeguro(p.url)}" target="_blank" rel="noopener noreferrer">Ver en NomadaWare</a>
    </article>`;
}

function pintar() {
  const q = texto.toLowerCase();
  let lista = productos.filter((p) => (!grupo || p.grupo === grupo) && p.nombre.toLowerCase().includes(q));
  lista = [...lista].sort((a, b) =>
    orden === 'precio' ? a.precioEfectivo - b.precioEfectivo : orden === 'precioDesc' ? b.precioEfectivo - a.precioEfectivo : a.nombre.localeCompare(b.nombre),
  );
  const grupos = [...new Set(productos.map((p) => p.grupo))].sort();
  const filtro = (valor, etiqueta) => `<button class="chips__filtro ${grupo === valor ? 'chips__filtro--activo' : ''}" data-grupo="${esc(valor)}">${esc(etiqueta)}</button>`;
  $('#grupos').innerHTML = [filtro('', `Todos (${productos.length})`), ...grupos.map((g) => filtro(g, g))].join('');
  $('#resultados').innerHTML = lista.length ? lista.map(tarjeta).join('') : '<div class="vacio">No hay productos con ese filtro.</div>';
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
