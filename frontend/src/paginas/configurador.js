import { montar, usuario } from '../js/layout.js';
import { actualizar as actualizarApi, api, consulta, enviar, irAIngresar } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, aviso, confirmar, copiar, dinero, esc, imagen, modal, param, retrasar } from '../js/util.js';
import { guardarPc, idsPc, leerPc, ponerEnPc, quitarDePc } from '../js/estado.js';
import tiendaProductos from '../datos/nomada.json';
import { armadoEnEdicion, terminarEdicion } from '../js/edicion.js';

// Aviso visible cuando se están editando las piezas de un armado guardado
const edicion = armadoEnEdicion();
if (edicion) {
  document.querySelector('.configurador').insertAdjacentHTML(
    'beforebegin',
    `<div class="aviso alerta edicion-armado">Editando las piezas de <b>${esc(edicion.nombre)}</b>: al pulsar «Guardar» se actualiza ese armado.
      <button class="enlace" id="cancelar-edicion" type="button">Cancelar edición</button></div>`,
  );
  document.querySelector('#cancelar-edicion').addEventListener('click', () => {
    terminarEdicion();
    location.href = `/armado.html?id=${edicion.id}`;
  });
}

montar('armar');

let categorias = [];
let resumen = null;
let uso = 'juegos';

// ---------- Asistente por presupuesto ----------
const asistente = $('#asistente');
const botonAsistente = $('#abrir-asistente');
function mostrarAsistente(ver) {
  asistente.classList.toggle('oculto', !ver);
  botonAsistente.innerHTML = ver ? `${icono('x')} Cerrar asistente` : `${icono('varita')} Usar el asistente`;
}
mostrarAsistente(param('modo') === 'guiado');
botonAsistente.addEventListener('click', () => mostrarAsistente(asistente.classList.contains('oculto')));
asistente.presupuesto.addEventListener('input', (e) => ($('#valor-presupuesto').textContent = dinero(e.target.value).replace('.00', '')));
asistente.addEventListener('submit', async (e) => {
  e.preventDefault();
  const boton = asistente.querySelector('button');
  boton.disabled = true;
  boton.textContent = 'Armando…';
  try {
    uso = asistente.uso.value;
    const r = await api(`/configurador/sugerir${consulta({ presupuesto: asistente.presupuesto.value, uso, sinGrafica: asistente.sinGrafica.checked })}`);
    const pc = Object.fromEntries(r.piezas.map((p) => [p.categoria, p.id]));
    // conserva los periféricos que ya había elegido
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
});

const esPeriferico = (codigo) => categorias.find((c) => c.codigo === codigo)?.grupo === 'periferico';

// ---------- Filas de categorías ----------
function fila(c) {
  const p = resumen?.piezas.find((x) => x.categoria === c.codigo);
  const conflicto = p?.conflicto;
  return `
    <div class="pieza-config ${conflicto ? 'pieza-config--conflicto' : ''}" data-cat="${c.codigo}">
      <div class="pieza-config__categoria">${imagen(c.imagenUrl, '', 'pieza-config__icono')}<div>${esc(c.nombre)}<small class="pieza-config__requisito">${c.obligatoria ? 'Necesaria' : 'Opcional'}</small></div></div>
      ${
        p
          ? `<div class="pieza-config__elegida">
              <a href="/producto.html?id=${p.id}">${imagen(p.imagen, p.nombre, 'pieza-config__foto')}</a>
              <div><a class="pieza-config__modelo" href="/producto.html?id=${p.id}"><b>${esc(p.nombre)}</b></a>
                <small class="pieza-config__detalle">${p.tieneOfertas && p.tienda ? `en <b style="color:${esc(p.tienda.color)};display:inline">${esc(p.tienda.nombre)}</b>${p.enStock ? '' : ' · sin stock'}` : 'Precio de referencia'}${p.consumoW ? ` · ${p.consumoW} W` : ''}</small>
                ${conflicto ? `<small class="pieza-config__aviso">${icono('alerta', 13)} Revisa la compatibilidad</small>` : ''}</div>
              <strong class="pieza-config__precio">${dinero(p.precio)}</strong>
            </div>`
          : `<div class="pieza-config__vacia">Aún no elegiste ${esc(c.nombre.toLowerCase())}</div>`
      }
      <div class="pieza-config__acciones">
        ${
          p
            ? `<button class="icono-boton" data-elegir="${c.codigo}" title="Cambiar">${icono('actualizar', 17)}</button><button class="icono-boton" data-quitar="${c.codigo}" title="Quitar">${icono('basura', 17)}</button>`
            : `<button class="boton pequeno" data-elegir="${c.codigo}">${icono('mas', 16)} Elegir</button>`
        }
      </div>
    </div>`;
}

function pintarListas() {
  $('#lista').innerHTML = categorias.filter((c) => c.grupo !== 'periferico').map(fila).join('');
  $('#perifericos').innerHTML = categorias.filter((c) => c.grupo === 'periferico').map(fila).join('');
}

// ---------- Resumen lateral ----------
function pintarResumen() {
  const r = resumen;
  const el = $('#resumen');
  if (!r || !r.piezas.length) {
    el.innerHTML = `<div class="caja sombra"><h3>Tu PC</h3><p class="tenue" style="margin:8px 0 14px">Empieza eligiendo un procesador o usa el asistente para armarlo automáticamente.</p>
      <button class="boton ancho" data-elegir="CPU">${icono('chip')} Elegir procesador</button></div>`;
    return;
  }
  const c = r.compatibilidad;
  const evaluadas = c.resultados.filter((x) => !x.omitida);
  const estado = !c.esCompatible ? 'mal' : evaluadas.length ? 'ok' : 'pendiente';
  const textoEstado = { mal: `${c.errores.length} problema(s) de compatibilidad`, ok: 'Todo compatible', pendiente: 'Elige más piezas para comprobar' }[estado];
  el.innerHTML = `
    <div class="caja sombra apilado">
      <div class="fila entre"><span class="antetitulo" style="margin:0">Total de hoy</span><span class="tenue pequeno">${r.piezas.length} pieza(s)</span></div>
      <div class="resumen-armado__total">${dinero(r.total)}</div>
      ${r.ahorro > 0 ? `<div class="resumen-armado__ahorro">Ahorras ${dinero(r.ahorro)} frente al precio de referencia</div>` : ''}
      <div class="compatibilidad__estado compatibilidad__estado--${estado}">${icono(estado === 'mal' ? 'alerta' : estado === 'ok' ? 'escudo' : 'info', 20)} ${textoEstado}</div>
      <div class="resumen-armado__medidor">
        <div class="dato"><small>Consumo estimado</small><b>${r.consumo} W</b></div>
        <div class="dato"><small>Rendimiento</small><b>${r.rendimiento?.puntaje ?? 0}/100</b></div>
      </div>
      ${r.rendimiento ? `<p class="pequeno"><b>${esc(r.rendimiento.nivel)}:</b> ${esc(r.rendimiento.descripcion)}</p>` : ''}
      ${r.rendimiento?.cuelloDeBotella ? `<div class="aviso alerta pequeno">${esc(r.rendimiento.cuelloDeBotella)}</div>` : ''}
      <label class="campo"><span>Uso principal</span>
        <select id="uso"><option value="juegos" ${uso === 'juegos' ? 'selected' : ''}>Juegos</option><option value="trabajo" ${uso === 'trabajo' ? 'selected' : ''}>Trabajo y creación</option></select></label>
      <div class="fila">
        <button class="boton violeta" id="guardar" style="flex:1">${icono('guardar', 16)} ${armadoEnEdicion() ? 'Guardar cambios' : 'Guardar'}</button>
        <button class="boton secundario" id="compartir" title="Copiar enlace">${icono('compartir', 16)}</button>
      </div>
      <a class="boton secundario ancho" href="/pedido.html" style="margin-top:10px">${icono('lista', 16)} Lista de compra</a>
    </div>
    <div class="caja">
      <h4 style="margin-bottom:10px">Compatibilidad</h4>
      <ul class="compatibilidad__reglas">${c.resultados
        .map(
          (x) => `<li class="compatibilidad__regla"><span class="compatibilidad__icono--${x.omitida ? 'omitida' : x.cumple ? 'ok' : 'mal'}">${icono(x.omitida ? 'menos' : x.cumple ? 'check' : 'x', 17)}</span>
            <span>${esc(x.regla)}<small class="compatibilidad__detalle">${esc(x.detalle)}</small></span></li>`,
        )
        .join('')}</ul>
    </div>
    ${
      r.advertencias?.length
        ? `<div class="caja"><h4 style="margin-bottom:8px">Pendiente</h4><ul class="pequeno tenue" style="margin:0;padding-left:18px">${r.advertencias.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>`
        : ''
    }
    ${
      r.porTienda?.length
        ? `<div class="caja"><h4 style="margin-bottom:10px">Si compras por tienda</h4><div class="apilado pequeno">${r.porTienda
            .map((t) => `<div class="fila entre"><span><span class="punto-color" style="background:${esc(t.color)};display:inline-block;margin-right:6px"></span>${esc(t.tienda)} <span class="tenue">(${t.piezas.length})</span></span><b>${dinero(t.subtotal)}</b></div>`)
            .join('')}</div></div>`
        : ''
    }`;
  $('#uso').addEventListener('change', (e) => {
    uso = e.target.value;
    actualizar();
  });
  $('#guardar').addEventListener('click', guardar);
  $('#compartir').addEventListener('click', () => copiar(`${location.origin}/configurador.html?piezas=${r.ids.join(',')}`));
}

async function actualizar() {
  const ids = idsPc();
  document.querySelector('.configurador').classList.add('cargando');
  try {
    resumen = ids.length ? await enviar('/configurador/resumen', { piezas: ids, uso }) : null;
    // Si alguna pieza guardada ya no existe, se limpia del estado local
    if (resumen) {
      const validas = Object.fromEntries(resumen.piezas.map((p) => [p.categoria, p.id]));
      if (Object.keys(validas).length !== ids.length) guardarPc(validas);
    }
  } catch (e) {
    aviso(e.message, 'error');
  } finally {
    document.querySelector('.configurador').classList.remove('cargando');
  }
  pintarListas();
  pintarResumen();
}

// ---------- Productos de NomadaWare dentro del selector ----------
// Se muestran aparte del catálogo: no tienen ficha técnica, así que no se revisa su compatibilidad.
const PALABRAS_TIENDA = {
  CPU: /procesador|ryzen|intel core|\bcore i\d|athlon|pentium|celeron/i,
  PLACA: /placa madre|motherboard|\b[abhxz]\d{3}\b/i,
  REFRIG: /refrigera|disipador|cooler|enfriamiento|liquid|\baio\b|pasta t[ée]rmica|ventilador/i,
  RAM: /\bram\b|ddr[45]|memoria/i,
  GPU: /tarjeta gr[aá]fica|\bgpu\b|geforce|radeon|\brtx\b|\bgtx\b|\brx \d/i,
  ALMAC: /\bssd\b|nvme|m\.?2|disco duro|\bhdd\b|almacenamiento/i,
  FUENTE: /fuente|power supply|\bpsu\b|\d+\s?w\b/i,
  CAJA: /\bcaja\b|gabinete|\bcase\b/i,
  MONITOR: /monitor|pantalla/i,
  RATON: /rat[oó]n|mouse/i,
  TECLADO: /teclado|keyboard/i,
  ALTAVOZ: /altavoz|parlante|bocina|speaker/i,
};

const enlaceTienda = (u) => (/^https?:\/\//.test(u || '') ? esc(u) : '#');

function productosTiendaDe(codigo, texto) {
  const patron = PALABRAS_TIENDA[codigo];
  const termino = texto.toLowerCase();
  return tiendaProductos
    .filter((p) => patron && patron.test(`${p.grupo} ${p.nombre}`))
    .filter((p) => !termino || `${p.grupo} ${p.nombre}`.toLowerCase().includes(termino))
    .sort((a, b) => a.precioEfectivo - b.precioEfectivo);
}

function htmlProductosTienda(codigo, texto) {
  const productos = productosTiendaDe(codigo, texto);
  if (!productos.length) return '';
  return `
    <div class="selector-piezas__tienda">
      <p class="pequeno tenue">${icono('tienda', 14)} Productos de NomadaWare (${productos.length}). Se compran en la tienda, no se agregan al armado.</p>
      ${productos
        .map(
          (p) => `<div class="opcion-pieza">
            ${imagen(p.imagen, p.nombre, 'opcion-pieza__foto')}
            <div><b class="opcion-pieza__nombre">${esc(p.nombre)}</b><div class="pequeno tenue">${esc(p.grupo)}</div></div>
            <div class="opcion-pieza__precio">${dinero(p.precioEfectivo)}<small class="opcion-pieza__tienda">NomadaWare</small></div>
            <a class="boton pequeno secundario opcion-pieza__boton" href="${enlaceTienda(p.url)}" target="_blank" rel="noopener">Ver en tienda</a>
          </div>`,
        )
        .join('')}
    </div>`;
}

// ---------- Selector de piezas (modal) ----------
async function elegir(codigo) {
  const c = categorias.find((x) => x.codigo === codigo);
  const m = modal({
    titulo: `Elige ${c.nombre.toLowerCase()}`,
    ancho: 860,
    contenido: `
      <div class="selector-piezas__herramientas">
        <input class="selector-piezas__buscar" type="search" placeholder="Buscar modelo…" id="m-buscar">
        <select class="selector-piezas__orden" id="m-orden"><option value="precio">Menor precio</option><option value="precio_desc">Mayor precio</option><option value="rendimiento">Más rendimiento</option><option value="nombre">Nombre</option></select>
        <label class="casilla"><input type="checkbox" id="m-compat" checked> Solo compatibles</label>
      </div>
      ${c.queMirar ? `<p class="pequeno tenue" style="margin-bottom:12px">${icono('info', 14)} ${esc(c.queMirar)}</p>` : ''}
      <div class="selector-piezas__lista" id="m-lista"><div class="esqueleto" style="height:300px"></div></div>`,
  });
  const lista = m.cuerpo.querySelector('#m-lista');
  const cargar = async () => {
    const otros = idsPc().filter((id) => id !== leerPc()[codigo]);
    try {
      const opciones = await api(
        `/configurador/opciones${consulta({ categoria: codigo, piezas: otros.join(','), buscar: m.cuerpo.querySelector('#m-buscar').value.trim(), orden: m.cuerpo.querySelector('#m-orden').value })}`,
      );
      const soloCompat = m.cuerpo.querySelector('#m-compat').checked;
      const visibles = soloCompat ? opciones.filter((o) => o.compatible) : opciones;
      const tienda = htmlProductosTienda(codigo, m.cuerpo.querySelector('#m-buscar').value.trim());
      lista.innerHTML = (visibles.length
        ? visibles
            .map(
              (o) => `<div class="opcion-pieza ${o.compatible ? '' : 'opcion-pieza--incompatible'} ${o.id === leerPc()[codigo] ? 'opcion-pieza--elegida' : ''}">
                ${imagen(o.imagen, o.nombre, 'opcion-pieza__foto')}
                <div><b class="opcion-pieza__nombre">${esc(o.nombre)}</b>
                  <div class="chips" style="margin-top:4px">${(o.destacados ?? []).slice(0, 3).map((x) => `<span>${esc(x)}</span>`).join('')}</div>
                  ${o.motivo ? `<div class="opcion-pieza__motivo">${icono('alerta', 13)} ${esc(o.motivo)}</div>` : ''}</div>
                <div class="opcion-pieza__precio">${dinero(o.precio)}<small class="opcion-pieza__tienda">${o.tieneOfertas && o.tienda ? esc(o.tienda.nombre) : 'referencia'}</small></div>
                <button class="boton pequeno opcion-pieza__boton ${o.compatible ? '' : 'secundario'}" data-id="${o.id}">${o.id === leerPc()[codigo] ? 'Elegida' : 'Elegir'}</button>
              </div>`,
            )
            .join('')
        : `<div class="vacio">No hay opciones${soloCompat ? ' compatibles con lo que ya elegiste. Desmarca “Solo compatibles” para ver todas' : ''}.</div>`) + tienda;
    } catch (e) {
      lista.innerHTML = `<div class="aviso error">${esc(e.message)}</div>`;
    }
  };
  m.cuerpo.querySelector('#m-buscar').addEventListener('input', retrasar(cargar, 250));
  m.cuerpo.querySelector('#m-orden').addEventListener('change', cargar);
  m.cuerpo.querySelector('#m-compat').addEventListener('change', cargar);
  lista.addEventListener('click', (e) => {
    const b = e.target.closest('[data-id]');
    if (!b) return;
    ponerEnPc(codigo, b.dataset.id);
    m.cerrar();
    actualizar();
  });
  cargar();
}

// ---------- Guardar en la cuenta ----------
async function guardar() {
  if (!usuario()) return irAIngresar();
  // Si se está editando un armado (Borrador o Por corregir), se actualizan sus piezas
  const editando = armadoEnEdicion();
  if (editando) {
    try {
      await actualizarApi(`/armados/${editando.id}/piezas`, { piezas: idsPc() }, 'PUT');
      terminarEdicion();
      aviso('Cambios guardados en el armado');
      setTimeout(() => (location.href = `/armado.html?id=${editando.id}`), 700);
    } catch (er) {
      aviso(er.message, 'error');
    }
    return;
  }
  const m = modal({
    titulo: 'Guardar armado',
    ancho: 480,
    contenido: `<form class="formulario"><label class="campo"><span>Nombre</span><input name="nombre" maxlength="80" required value="Mi PC ${uso === 'juegos' ? 'gamer' : 'de trabajo'}"></label>
      <p class="pequeno tenue">Se guarda con los precios de hoy; en tu cuenta verás si subió o bajó.</p><button class="boton violeta">Guardar</button></form>`,
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

// ---------- Eventos generales ----------
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
  if (!idsPc().length || !(await confirmar({ titulo: '¿Quitar todas las piezas?', mensaje: 'Tu armado actual quedará vacío.', boton: 'Vaciar' }))) return;
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
