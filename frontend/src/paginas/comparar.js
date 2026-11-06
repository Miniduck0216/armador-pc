import { montar, usuario } from '../js/layout.js';
import { api, enviar } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, aviso, dinero, errorEn, esc, imagen, insigniaGama } from '../js/util.js';
import { mosaicoCategoria } from '../js/tarjetas.js';
import { leerComparar, MAX_COMPARAR } from '../js/estado.js';

montar('componentes');

const url = new URLSearchParams(location.search);
const guardado = leerComparar();
let categoria = url.get('categoria') || guardado.categoria || 'CPU';
let ids = (url.get('ids') ?? (guardado.categoria === categoria ? guardado.items.map((x) => x.id).join(',') : ''))
  .split(',')
  .map(Number)
  .filter(Boolean)
  .slice(0, MAX_COMPARAR);
let categorias = [];
let catalogo = []; // modelos de la categoría elegida
let soloDiferencias = false;

function sincronizarUrl() {
  history.replaceState(null, '', `/comparar.html?categoria=${categoria}${ids.length ? `&ids=${ids.join(',')}` : ''}`);
}

function pintarCategorias() {
  $('#categorias').innerHTML = categorias
    .map((c) => mosaicoCategoria(c, `/comparar.html?categoria=${c.codigo}`).replace('class="mosaico"', `class="mosaico ${c.codigo === categoria ? 'activo' : ''}" data-cat="${c.codigo}"`))
    .join('');
}

function pintarRanuras() {
  const html = [];
  for (let i = 0; i < MAX_COMPARAR; i++) {
    const p = catalogo.find((x) => x.id === ids[i]);
    html.push(
      p
        ? `<div class="ranura llena">
            <button class="icono-boton quitar" data-quitar="${i}" aria-label="Quitar">${icono('x', 16)}</button>
            ${imagen(p.imagen, p.nombreCompleto)}
            <div>${insigniaGama(p.gama)}</div>
            <h3><a href="/producto.html?id=${p.id}">${esc(p.nombreCompleto)}</a></h3>
            <b>${dinero(p.tieneOfertas ? p.precio : p.precioReferencia)}</b>
          </div>`
        : `<div class="ranura">
            <span class="antetitulo">Modelo ${i + 1}</span>
            <div class="selector"><input type="search" placeholder="Busca un modelo…" data-buscar="${i}" autocomplete="off"><div class="opciones oculto"></div></div>
            <p class="tenue pequeno">${i < 2 ? 'Necesitas al menos 2 modelos.' : 'Opcional'}</p>
          </div>`,
    );
  }
  $('#ranuras').innerHTML = html.join('');
}

function opciones(texto) {
  const q = texto.toLowerCase();
  return catalogo
    .filter((p) => !ids.includes(p.id) && p.nombreCompleto.toLowerCase().includes(q))
    .slice(0, 30)
    .map((p) => `<button type="button" data-elegir="${p.id}">${imagen(p.imagen, '')}<span>${esc(p.nombreCompleto)}</span><b>${dinero(p.tieneOfertas ? p.precio : p.precioReferencia)}</b></button>`)
    .join('') || '<div class="tenue pequeno" style="padding:10px">Sin coincidencias</div>';
}

async function comparar() {
  sincronizarUrl();
  pintarRanuras();
  const r = $('#resultado');
  if (ids.length < 2) {
    r.innerHTML = `<div class="vacio">Elige al menos dos ${esc(categorias.find((c) => c.codigo === categoria)?.plural.toLowerCase() ?? 'modelos')} para ver la comparación.</div>`;
    return;
  }
  r.classList.add('cargando');
  try {
    const d = await api(`/comparar-componentes?ids=${ids.join(',')}`);
    let cpu = null;
    if (categoria === 'CPU' && ids.length === 2) cpu = await api(`/comparar?a=${ids[0]}&b=${ids[1]}`).catch(() => null);
    r.innerHTML = `
      <div class="veredicto">
        ${d.resumen.masBarato ? `<div class="caja"><small>${icono('etiqueta', 14)} Más barato</small><b>${esc(d.resumen.masBarato.nombre)}</b><span class="tenue">${dinero(d.resumen.masBarato.precio)}</span></div>` : ''}
        ${d.resumen.masPotente ? `<div class="caja"><small>${icono('rayo', 14)} Más potente</small><b>${esc(d.resumen.masPotente.nombre)}</b><span class="tenue">Puntaje ${d.resumen.masPotente.puntaje}/100</span></div>` : ''}
        ${cpu ? `<div class="caja"><small>${icono('estrella', 14)} Gana en más apartados</small><b>${esc((cpu.ganador === 'a' ? cpu.a : cpu.b).nombreCompleto)}</b><span class="tenue">${Math.max(cpu.victoriasA, cpu.victoriasB)} victorias · ${cpu.diferenciaPuntos} puntos de diferencia</span></div>` : ''}
      </div>
      <div class="fila entre" style="margin-bottom:12px">
        <h2>Detalle lado a lado</h2>
        <div class="fila">
          <label class="casilla solo-diferencias"><input type="checkbox" id="solo-dif" ${soloDiferencias ? 'checked' : ''}> Mostrar solo diferencias</label>
          ${cpu ? `<button class="boton secundario pequeno" id="guardar-comp">${icono('guardar', 15)} Guardar comparación</button>` : ''}
        </div>
      </div>
      <div class="tabla-envoltura"><table class="tabla tabla-comparar">
        <thead><tr><th></th>${d.productos.map((p) => `<th>${esc(p.nombreCompleto)}</th>`).join('')}</tr></thead>
        <tbody>${d.filas
          .map(
            (f) => `<tr class="${f.diferente === false ? 'igual' : ''}" ${soloDiferencias && f.diferente === false ? 'hidden' : ''}><td>${esc(f.etiqueta)}</td>${f.valores
              .map((v, i) => `<td class="${f.ganadores?.[i] && f.ganadores.filter(Boolean).length < f.valores.length ? 'ganador' : ''}">${esc(v ?? '—')}</td>`)
              .join('')}</tr>`,
          )
          .join('')}</tbody>
      </table></div>
      ${
        cpu
          ? `<div class="razones">
              ${[['a', cpu.a, cpu.razonesA], ['b', cpu.b, cpu.razonesB]]
                .map(
                  ([, p, razones]) => `<div class="caja pros-contras-una"><h3>Por qué elegir ${esc(p.nombreCompleto)}</h3>
                    <ul class="lista-razones">${razones.length ? razones.map((x) => `<li>${icono('check', 18)}<span>${esc(x.texto)}<small>${esc(x.valor)}</small></span></li>`).join('') : '<li class="tenue">Sin ventajas claras</li>'}</ul></div>`,
                )
                .join('')}
            </div>`
          : ''
      }`;
    $('#solo-dif').addEventListener('change', (e) => {
      soloDiferencias = e.target.checked;
      r.querySelectorAll('tr.igual').forEach((tr) => (tr.hidden = soloDiferencias));
    });
    $('#guardar-comp')?.addEventListener('click', async () => {
      if (!usuario()) return (location.href = `/ingresar.html?volver=${encodeURIComponent(location.pathname + location.search)}`);
      try {
        await enviar('/comparaciones', { a: ids[0], b: ids[1] });
        aviso('Comparación guardada en tu cuenta');
      } catch (e) {
        aviso(e.message, 'error');
      }
    });
  } catch (e) {
    errorEn(r, e);
  } finally {
    r.classList.remove('cargando');
  }
}

async function cambiarCategoria(codigo) {
  if (codigo !== categoria) ids = [];
  categoria = codigo;
  pintarCategorias();
  const lista = await api(`/componentes?categoria=${categoria}&limite=60&orden=rendimiento`);
  catalogo = lista.resultados;
  ids = ids.filter((id) => catalogo.some((p) => p.id === id));
  comparar();
}

// Eventos de las ranuras (búsqueda, elegir, quitar)
$('#ranuras').addEventListener('input', (e) => {
  const entrada = e.target.closest('[data-buscar]');
  if (!entrada) return;
  const caja = entrada.nextElementSibling;
  caja.innerHTML = opciones(entrada.value.trim());
  caja.classList.remove('oculto');
});
$('#ranuras').addEventListener('focusin', (e) => {
  const entrada = e.target.closest('[data-buscar]');
  if (!entrada) return;
  entrada.nextElementSibling.innerHTML = opciones(entrada.value.trim());
  entrada.nextElementSibling.classList.remove('oculto');
});
$('#ranuras').addEventListener('click', (e) => {
  const elegir = e.target.closest('[data-elegir]');
  if (elegir) {
    ids.push(Number(elegir.dataset.elegir));
    return comparar();
  }
  const quitar = e.target.closest('[data-quitar]');
  if (quitar) {
    ids.splice(Number(quitar.dataset.quitar), 1);
    comparar();
  }
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.selector')) document.querySelectorAll('.ranura .opciones').forEach((o) => o.classList.add('oculto'));
});
$('#categorias').addEventListener('click', (e) => {
  const a = e.target.closest('[data-cat]');
  if (!a) return;
  e.preventDefault();
  cambiarCategoria(a.dataset.cat);
});

api('/categorias')
  .then((c) => {
    categorias = c;
    if (!categorias.some((x) => x.codigo === categoria)) categoria = 'CPU';
    return cambiarCategoria(categoria);
  })
  .catch((e) => errorEn($('#resultado'), e));
