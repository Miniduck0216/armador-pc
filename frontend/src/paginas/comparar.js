import { montar, usuario } from '../js/layout.js';
import { api, enviar } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, aviso, dinero, errorEn, esc, imagen, insigniaGama, tabla } from '../js/util.js';
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
    .map((c) =>
      mosaicoCategoria(c, {
        href: `/comparar.html?categoria=${c.codigo}`,
        modificador: `mosaico--compacto ${c.codigo === categoria ? 'mosaico--activo' : ''}`,
        atributos: `data-cat="${c.codigo}"`,
      }),
    )
    .join('');
}

const precioDe = (p) => dinero(p.tieneOfertas ? p.precio : p.precioReferencia);

// Las tres ranuras: con un modelo elegido o con un buscador para elegirlo
function pintarRanuras() {
  const html = [];
  for (let i = 0; i < MAX_COMPARAR; i++) {
    const p = catalogo.find((x) => x.id === ids[i]);
    html.push(
      p
        ? `<div class="ranuras__ranura ranuras__ranura--llena">
            <button class="icono-boton ranuras__quitar" data-quitar="${i}" aria-label="Quitar">${icono('x', 16)}</button>
            ${imagen(p.imagen, p.nombreCompleto, 'ranuras__imagen')}
            <div>${insigniaGama(p.gama)}</div>
            <h3 class="ranuras__nombre"><a href="/producto.html?id=${p.id}">${esc(p.nombreCompleto)}</a></h3>
            <b>${precioDe(p)}</b>
          </div>`
        : `<div class="ranuras__ranura">
            <span class="seccion__antetitulo">Modelo ${i + 1}</span>
            <div class="ranuras__selector"><input type="search" placeholder="Busca un modelo…" data-buscar="${i}" autocomplete="off"><div class="ranuras__opciones" hidden></div></div>
            <p class="texto texto--tenue texto--pequeno">${i < 2 ? 'Necesitas al menos 2 modelos.' : 'Opcional'}</p>
          </div>`,
    );
  }
  $('#ranuras').innerHTML = html.join('');
}

function opciones(texto) {
  const q = texto.toLowerCase();
  const lista = catalogo
    .filter((p) => !ids.includes(p.id) && p.nombreCompleto.toLowerCase().includes(q))
    .slice(0, 30)
    .map((p) => `<button class="ranuras__opcion" type="button" data-elegir="${p.id}">${imagen(p.imagen, '', 'ranuras__miniatura')}<span>${esc(p.nombreCompleto)}</span><b>${precioDe(p)}</b></button>`)
    .join('');
  return lista || '<div class="ranuras__sin-resultados">Sin coincidencias</div>';
}

// Tarjeta del veredicto (más barato, más potente, ganador)
const veredicto = (ico, titulo, nombre, detalle) =>
  `<div class="caja veredicto__caja"><small class="veredicto__etiqueta">${icono(ico, 14)} ${titulo}</small><b class="veredicto__nombre">${esc(nombre)}</b><span class="texto texto--tenue">${detalle}</span></div>`;

async function comparar() {
  sincronizarUrl();
  pintarRanuras();
  const r = $('#resultado');
  if (ids.length < 2) {
    r.innerHTML = `<div class="vacio">Elige al menos dos ${esc(categorias.find((c) => c.codigo === categoria)?.plural.toLowerCase() ?? 'modelos')} para ver la comparación.</div>`;
    return;
  }
  r.classList.add('comparacion--cargando');
  try {
    const d = await api(`/comparar-componentes?ids=${ids.join(',')}`);
    let cpu = null;
    if (categoria === 'CPU' && ids.length === 2) cpu = await api(`/comparar?a=${ids[0]}&b=${ids[1]}`).catch(() => null);
    const { masBarato, masPotente } = d.resumen;
    const ganador = cpu ? (cpu.ganador === 'a' ? cpu.a : cpu.b) : null;

    // Fila por característica; en verde el valor que gana (si no empatan todos)
    const filas = d.filas.map((f) => ({
      modificador: f.diferente === false ? 'igual' : '',
      celdas: [
        [esc(f.etiqueta), 'etiqueta'],
        ...f.valores.map((v, i) => {
          const gana = f.ganadores?.[i] && f.ganadores.filter(Boolean).length < f.valores.length;
          return [esc(v ?? '—'), gana ? 'centro ganadora' : 'centro'];
        }),
      ],
    }));

    const razones = cpu
      ? `<div class="comparacion__razones">${[[cpu.a, cpu.razonesA], [cpu.b, cpu.razonesB]]
          .map(
            ([p, lista]) => `<div class="caja"><h3>Por qué elegir ${esc(p.nombreCompleto)}</h3>
              <ul class="pros-contras__lista">${
                lista.length
                  ? lista.map((x) => `<li class="pros-contras__item">${icono('check', 18, 'icono--verde')}<span>${esc(x.texto)}<small class="pros-contras__detalle">${esc(x.valor)}</small></span></li>`).join('')
                  : '<li class="texto texto--tenue">Sin ventajas claras</li>'
              }</ul></div>`,
          )
          .join('')}</div>`
      : '';

    r.innerHTML = `
      <div class="veredicto">
        ${masBarato ? veredicto('etiqueta', 'Más barato', masBarato.nombre, dinero(masBarato.precio)) : ''}
        ${masPotente ? veredicto('rayo', 'Más potente', masPotente.nombre, `Puntaje ${masPotente.puntaje}/100`) : ''}
        ${cpu ? veredicto('estrella', 'Gana en más apartados', ganador.nombreCompleto, `${Math.max(cpu.victoriasA, cpu.victoriasB)} victorias · ${cpu.diferenciaPuntos} puntos de diferencia`) : ''}
      </div>
      <div class="fila fila--entre comparacion__cabecera">
        <h2>Detalle lado a lado</h2>
        <div class="fila">
          <label class="formulario__casilla"><input type="checkbox" id="solo-dif" ${soloDiferencias ? 'checked' : ''}> Mostrar solo diferencias</label>
          ${cpu ? `<button class="boton boton--secundario boton--pequeno" id="guardar-comp">${icono('guardar', 15)} Guardar comparación</button>` : ''}
        </div>
      </div>
      ${tabla(['', ...d.productos.map((p) => [esc(p.nombreCompleto), 'centro'])], filas)}
      ${razones}`;
    const ocultarIguales = () => r.querySelectorAll('.tabla__fila--igual').forEach((tr) => (tr.hidden = soloDiferencias));
    ocultarIguales();
    $('#solo-dif').addEventListener('change', (e) => {
      soloDiferencias = e.target.checked;
      ocultarIguales();
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
    r.classList.remove('comparacion--cargando');
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

// La lista de modelos está justo después del buscador
function mostrarOpciones(entrada) {
  const caja = entrada.nextElementSibling;
  caja.innerHTML = opciones(entrada.value.trim());
  caja.hidden = false;
}

// Eventos de las ranuras (búsqueda, elegir, quitar)
$('#ranuras').addEventListener('input', (e) => {
  const entrada = e.target.closest('[data-buscar]');
  if (!entrada) return;
  mostrarOpciones(entrada);
});
$('#ranuras').addEventListener('focusin', (e) => {
  const entrada = e.target.closest('[data-buscar]');
  if (entrada) mostrarOpciones(entrada);
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
  if (!e.target.closest('.ranuras__selector')) document.querySelectorAll('.ranuras__opciones').forEach((o) => (o.hidden = true));
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
