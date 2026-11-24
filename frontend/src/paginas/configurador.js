// Configurador (core): eliges una pieza por categoría y el servidor responde con el
// total, la compatibilidad, el consumo y el rendimiento del equipo.
//   1. Asistente por presupuesto   2. Filas de categorías   3. Resumen lateral
//   4. Selector de piezas (modal)  5. Guardar en la cuenta  6. Eventos
import { montar, usuario } from '../js/layout.js';
import { actualizar as actualizarApi, api, consulta, enviar, irAIngresar } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, aviso, confirmar, copiar, dinero, esc, imagen, modal, param, retrasar } from '../js/util.js';
import { guardarPc, idsPc, leerPc, ponerEnPc, quitarDePc } from '../js/estado.js';
import { chips } from '../js/tarjetas.js';
import { estadoCompatibilidad, listaReglas } from '../js/compatibilidad.js';
import { armadoEnEdicion, terminarEdicion } from '../js/edicion.js';
import { productosTienda } from './nomada.js';

montar('armar');

let categorias = [];
let resumen = null; // última respuesta del servidor
let uso = 'juegos';

const esPeriferico = (codigo) => categorias.find((c) => c.codigo === codigo)?.grupo === 'periferico';

// Aviso cuando se están editando las piezas de un armado guardado
const edicion = armadoEnEdicion();
if (edicion) {
  $('#aviso-edicion').hidden = false;
  $('#nombre-edicion').textContent = edicion.nombre;
  $('#cancelar-edicion').addEventListener('click', () => {
    terminarEdicion();
    location.href = `/armado.html?id=${edicion.id}`;
  });
}

// ---------- 1. Asistente por presupuesto ----------
const asistente = $('#asistente');
const botonAsistente = $('#abrir-asistente');

function mostrarAsistente(ver) {
  asistente.hidden = !ver;
  botonAsistente.innerHTML = ver ? `${icono('x')} Cerrar asistente` : `${icono('varita')} Usar el asistente`;
}

async function armarConAsistente(e) {
  e.preventDefault();
  const boton = asistente.querySelector('button');
  boton.disabled = true;
  boton.textContent = 'Armando…';
  try {
    uso = asistente.uso.value;
    const datos = { presupuesto: asistente.presupuesto.value, uso, sinGrafica: asistente.sinGrafica.checked };
    const r = await api(`/configurador/sugerir${consulta(datos)}`);
    const pc = Object.fromEntries(r.piezas.map((p) => [p.categoria, p.id]));
    // Se conservan los periféricos que ya había elegido
    for (const [cat, id] of Object.entries(leerPc())) if (esPeriferico(cat)) pc[cat] = id;
    guardarPc(pc);
    aviso(`Listo: equipo de ${dinero(r.total)}${r.sobrante > 0 ? ` (te sobran ${dinero(r.sobrante)})` : ''}`);
    mostrarAsistente(false);
    await actualizar();
    $('#lista').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (er) {
    aviso(er.message, 'error');
  } finally {
    boton.disabled = false;
    boton.textContent = 'Armar mi PC';
  }
}

// ---------- 2. Filas de categorías ----------
function piezaElegida(p) {
  const tienda = p.tieneOfertas && p.tienda ? `en <b style="color:${esc(p.tienda.color)}">${esc(p.tienda.nombre)}</b>${p.enStock ? '' : ' · sin stock'}` : 'Precio de referencia';
  return `<div class="pieza-config__elegida">
      <a href="/producto.html?id=${p.id}">${imagen(p.imagen, p.nombre, 'pieza-config__foto')}</a>
      <div>
        <a class="pieza-config__modelo" href="/producto.html?id=${p.id}"><b>${esc(p.nombre)}</b></a>
        <small class="pieza-config__detalle">${tienda}${p.consumoW ? ` · ${p.consumoW} W` : ''}</small>
        ${p.conflicto ? `<small class="pieza-config__aviso">${icono('alerta', 13)} Revisa la compatibilidad</small>` : ''}
      </div>
      <strong class="pieza-config__precio">${dinero(p.precio)}</strong>
    </div>`;
}

function fila(c) {
  const p = resumen?.piezas.find((x) => x.categoria === c.codigo);
  const botones = p
    ? `<button class="icono-boton" data-elegir="${c.codigo}" title="Cambiar">${icono('actualizar', 17)}</button>
       <button class="icono-boton" data-quitar="${c.codigo}" title="Quitar">${icono('basura', 17)}</button>`
    : `<button class="boton boton--pequeno" data-elegir="${c.codigo}">${icono('mas', 16)} Elegir</button>`;
  return `
    <div class="pieza-config ${p?.conflicto ? 'pieza-config--conflicto' : ''}" data-cat="${c.codigo}">
      <div class="pieza-config__categoria">${imagen(c.imagenUrl, '', 'pieza-config__icono')}
        <div>${esc(c.nombre)}<small class="pieza-config__requisito">${c.obligatoria ? 'Necesaria' : 'Opcional'}</small></div></div>
      ${p ? piezaElegida(p) : `<div class="pieza-config__vacia">Aún no elegiste ${esc(c.nombre.toLowerCase())}</div>`}
      <div class="pieza-config__acciones">${botones}</div>
    </div>`;
}

function pintarListas() {
  $('#lista').innerHTML = categorias.filter((c) => !esPeriferico(c.codigo)).map(fila).join('');
  $('#perifericos').innerHTML = categorias.filter((c) => esPeriferico(c.codigo)).map(fila).join('');
}

// ---------- 3. Resumen lateral ----------
// Estado general: mal (hay errores), ok (todo cumple) o pendiente (faltan piezas para revisar)
function estadoGeneral(c) {
  const evaluadas = c.resultados.filter((x) => !x.omitida);
  const estado = !c.esCompatible ? 'mal' : evaluadas.length ? 'ok' : 'pendiente';
  const texto = { mal: `${c.errores.length} problema(s) de compatibilidad`, ok: 'Todo compatible', pendiente: 'Elige más piezas para comprobar' }[estado];
  return estadoCompatibilidad(estado, texto);
}

function cajaTotal(r) {
  const rend = r.rendimiento;
  return `
    <div class="caja caja--sombra caja--pila">
      <div class="fila fila--entre"><span class="seccion__antetitulo resumen-armado__etiqueta">Total de hoy</span><span class="texto texto--tenue texto--pequeno">${r.piezas.length} pieza(s)</span></div>
      <div class="resumen-armado__total">${dinero(r.total)}</div>
      ${r.ahorro > 0 ? `<div class="resumen-armado__ahorro">Ahorras ${dinero(r.ahorro)} frente al precio de referencia</div>` : ''}
      ${estadoGeneral(r.compatibilidad)}
      <div class="datos datos--dos">
        <div class="datos__dato"><small class="datos__etiqueta">Consumo estimado</small><b class="datos__valor">${r.consumo} W</b></div>
        <div class="datos__dato"><small class="datos__etiqueta">Rendimiento</small><b class="datos__valor">${rend?.puntaje ?? 0}/100</b></div>
      </div>
      ${rend ? `<p class="texto texto--pequeno"><b>${esc(rend.nivel)}:</b> ${esc(rend.descripcion)}</p>` : ''}
      ${rend?.cuelloDeBotella ? `<div class="aviso aviso--alerta aviso--pequeno">${esc(rend.cuelloDeBotella)}</div>` : ''}
      <label class="formulario__campo"><span class="formulario__etiqueta">Uso principal</span>
        <select id="uso">
          <option value="juegos" ${uso === 'juegos' ? 'selected' : ''}>Juegos</option>
          <option value="trabajo" ${uso === 'trabajo' ? 'selected' : ''}>Trabajo y creación</option>
        </select></label>
      <div class="fila">
        <button class="boton boton--violeta resumen-armado__guardar" id="guardar">${icono('guardar', 16)} ${armadoEnEdicion() ? 'Guardar cambios' : 'Guardar'}</button>
        <button class="boton boton--secundario" id="compartir" title="Copiar enlace">${icono('compartir', 16)}</button>
      </div>
      <a class="boton boton--secundario boton--ancho" href="/pedido.html">${icono('lista', 16)} Lista de compra</a>
    </div>`;
}

function cajaPorTienda(porTienda) {
  if (!porTienda?.length) return '';
  const filas = porTienda
    .map(
      (t) => `<div class="fila fila--entre"><span><span class="tienda-fila__color resumen-armado__color" style="background:${esc(t.color)}"></span>${esc(t.tienda)}
        <span class="texto texto--tenue">(${t.piezas.length})</span></span><b>${dinero(t.subtotal)}</b></div>`,
    )
    .join('');
  return `<div class="caja"><h4 class="resumen-armado__titulo">Si compras por tienda</h4><div class="pila pila--chica texto texto--pequeno">${filas}</div></div>`;
}

function pintarResumen() {
  const r = resumen;
  const el = $('#resumen');
  if (!r?.piezas.length) {
    el.innerHTML = `<div class="caja caja--sombra caja--pila"><h3>Tu PC</h3>
      <p class="texto texto--tenue">Empieza eligiendo un procesador o usa el asistente para armarlo automáticamente.</p>
      <button class="boton boton--ancho" data-elegir="CPU">${icono('chip')} Elegir procesador</button></div>`;
    return;
  }
  const pendientes = r.advertencias?.length
    ? `<div class="caja"><h4 class="resumen-armado__titulo">Pendiente</h4><ul class="resumen-armado__pendientes">${r.advertencias.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>`
    : '';
  el.innerHTML = `
    ${cajaTotal(r)}
    <div class="caja"><h4 class="resumen-armado__titulo">Compatibilidad</h4>${listaReglas(r.compatibilidad.resultados)}</div>
    ${pendientes}
    ${cajaPorTienda(r.porTienda)}`;
  $('#uso').addEventListener('change', (e) => {
    uso = e.target.value;
    actualizar();
  });
  $('#guardar').addEventListener('click', guardar);
  $('#compartir').addEventListener('click', () => copiar(`${location.origin}/configurador.html?piezas=${r.ids.join(',')}`));
}

// Pide al servidor el resumen de las piezas elegidas y vuelve a pintar todo
async function actualizar() {
  const ids = idsPc();
  const zona = $('.configurador');
  zona.classList.add('configurador--cargando');
  try {
    resumen = ids.length ? await enviar('/configurador/resumen', { piezas: ids, uso }) : null;
    // Si alguna pieza guardada ya no existe, se quita del navegador
    if (resumen) {
      const validas = Object.fromEntries(resumen.piezas.map((p) => [p.categoria, p.id]));
      if (Object.keys(validas).length !== ids.length) guardarPc(validas);
    }
  } catch (e) {
    aviso(e.message, 'error');
  } finally {
    zona.classList.remove('configurador--cargando');
  }
  pintarListas();
  pintarResumen();
}

// ---------- 4. Selector de piezas (ventana modal) ----------
function opcion(o, elegida) {
  return `<div class="opcion-pieza ${o.compatible ? '' : 'opcion-pieza--incompatible'} ${elegida ? 'opcion-pieza--elegida' : ''}">
      ${imagen(o.imagen, o.nombre, 'opcion-pieza__foto')}
      <div><b class="opcion-pieza__nombre">${esc(o.nombre)}</b>
        ${chips((o.destacados ?? []).slice(0, 3))}
        ${o.motivo ? `<div class="opcion-pieza__motivo">${icono('alerta', 13)} ${esc(o.motivo)}</div>` : ''}</div>
      <div class="opcion-pieza__precio">${dinero(o.precio)}<small class="opcion-pieza__tienda">${o.tieneOfertas && o.tienda ? esc(o.tienda.nombre) : 'referencia'}</small></div>
      <button class="boton boton--pequeno opcion-pieza__boton ${o.compatible ? '' : 'boton--secundario'}" data-id="${o.id}">${elegida ? 'Elegida' : 'Elegir'}</button>
    </div>`;
}

async function elegir(codigo) {
  const c = categorias.find((x) => x.codigo === codigo);
  const m = modal({
    titulo: `Elige ${c.nombre.toLowerCase()}`,
    ancho: 860,
    contenido: `
      <div class="selector-piezas__herramientas">
        <input class="selector-piezas__buscar" type="search" placeholder="Buscar modelo…" id="m-buscar">
        <select class="formulario__corto" id="m-orden"><option value="precio">Menor precio</option><option value="precio_desc">Mayor precio</option><option value="rendimiento">Más rendimiento</option><option value="nombre">Nombre</option></select>
        <label class="formulario__casilla"><input type="checkbox" id="m-compat" checked> Solo compatibles</label>
      </div>
      ${c.queMirar ? `<p class="selector-piezas__consejo">${icono('info', 14)} ${esc(c.queMirar)}</p>` : ''}
      <div class="selector-piezas__lista" id="m-lista"><div class="esqueleto esqueleto--alto"></div></div>`,
  });
  const campo = (id) => m.cuerpo.querySelector(id);
  const lista = campo('#m-lista');

  const cargar = async () => {
    const elegida = leerPc()[codigo];
    const otras = idsPc().filter((id) => id !== elegida);
    const buscar = campo('#m-buscar').value.trim();
    try {
      const opciones = await api(`/configurador/opciones${consulta({ categoria: codigo, piezas: otras.join(','), buscar, orden: campo('#m-orden').value })}`);
      const soloCompat = campo('#m-compat').checked;
      const visibles = soloCompat ? opciones.filter((o) => o.compatible) : opciones;
      const vacio = `<div class="vacio">No hay opciones${soloCompat ? ' compatibles con lo que ya elegiste. Desmarca “Solo compatibles” para ver todas' : ''}.</div>`;
      lista.innerHTML = (visibles.length ? visibles.map((o) => opcion(o, o.id === elegida)).join('') : vacio) + productosTienda(codigo, buscar);
    } catch (e) {
      lista.innerHTML = `<div class="aviso aviso--error">${esc(e.message)}</div>`;
    }
  };
  campo('#m-buscar').addEventListener('input', retrasar(cargar, 250));
  campo('#m-orden').addEventListener('change', cargar);
  campo('#m-compat').addEventListener('change', cargar);
  lista.addEventListener('click', (e) => {
    const b = e.target.closest('[data-id]');
    if (!b) return;
    ponerEnPc(codigo, b.dataset.id);
    m.cerrar();
    actualizar();
  });
  cargar();
}

// ---------- 5. Guardar en la cuenta ----------
async function guardarCambiosDeArmado(editando) {
  try {
    await actualizarApi(`/armados/${editando.id}/piezas`, { piezas: idsPc() }, 'PUT');
    terminarEdicion();
    aviso('Cambios guardados en el armado');
    setTimeout(() => (location.href = `/armado.html?id=${editando.id}`), 700);
  } catch (er) {
    aviso(er.message, 'error');
  }
}

async function guardar() {
  if (!usuario()) return irAIngresar();
  // Si se está editando un armado (Borrador o Por corregir), solo se actualizan sus piezas
  const editando = armadoEnEdicion();
  if (editando) return guardarCambiosDeArmado(editando);

  const m = modal({
    titulo: 'Guardar armado',
    ancho: 480,
    contenido: `<form class="formulario">
      <label class="formulario__campo"><span class="formulario__etiqueta">Nombre</span><input name="nombre" maxlength="80" required value="Mi PC ${uso === 'juegos' ? 'gamer' : 'de trabajo'}"></label>
      <p class="formulario__ayuda">Se guarda con los precios de hoy; en tu cuenta verás si subió o bajó.</p>
      <button class="boton boton--violeta">Guardar</button></form>`,
  });
  m.cuerpo.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const r = await enviar('/armados', { nombre: e.target.nombre.value.trim(), piezas: idsPc() });
      m.cerrar();
      aviso('Armado guardado');
      setTimeout(() => (location.href = `/armado.html?id=${r.id}`), 700);
    } catch (er) {
      aviso(er.message, 'error');
    }
  });
}

// ---------- 6. Eventos ----------
mostrarAsistente(param('modo') === 'guiado');
botonAsistente.addEventListener('click', () => mostrarAsistente(asistente.hidden));
asistente.presupuesto.addEventListener('input', (e) => ($('#valor-presupuesto').textContent = dinero(e.target.value).replace('.00', '')));
asistente.addEventListener('submit', armarConAsistente);

// Botones "Elegir", "Cambiar" y "Quitar" de las filas y del resumen
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-elegir]');
  if (el) return elegir(el.dataset.elegir);
  const q = e.target.closest('[data-quitar]');
  if (q) {
    quitarDePc(q.dataset.quitar);
    actualizar();
  }
});

$('#vaciar').addEventListener('click', async () => {
  if (!idsPc().length) return;
  if (!(await confirmar({ titulo: '¿Quitar todas las piezas?', mensaje: 'Tu armado actual quedará vacío.', boton: 'Vaciar' }))) return;
  guardarPc({});
  actualizar();
});

async function iniciar() {
  categorias = await api('/categorias').catch(() => []);
  // ?piezas=1,2,3 (desde una configuración o un enlace compartido) reemplaza el armado actual
  const piezas = param('piezas');
  if (piezas) {
    try {
      const r = await enviar('/configurador/resumen', { piezas: piezas.split(',').map(Number).filter(Boolean) });
      guardarPc(Object.fromEntries(r.piezas.map((p) => [p.categoria, p.id])));
    } catch {
      aviso('No se pudo cargar el armado del enlace', 'error');
    }
    history.replaceState(null, '', '/configurador.html');
  }
  await actualizar();
}
iniciar();
