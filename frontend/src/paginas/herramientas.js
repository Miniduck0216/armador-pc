import { montar } from '../js/layout.js';
import { api, enviar } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, $$, aviso, dinero, esc, imagen } from '../js/util.js';
import { guardarPc, leerPc } from '../js/estado.js';

montar('herramientas');
$$('[data-icono]').forEach((el) => (el.innerHTML = icono(el.dataset.icono, 26)));

const CATS_COMPAT = [
  ['CPU', 'Procesador'], ['PLACA', 'Placa madre'], ['RAM', 'Memoria RAM'], ['GPU', 'Tarjeta gráfica'],
  ['REFRIG', 'Refrigeración'], ['ALMAC', 'Almacenamiento'], ['FUENTE', 'Fuente de poder'], ['CAJA', 'Caja'],
];
const catalogo = {}; // código → lista de componentes

async function modelos(codigo) {
  catalogo[codigo] ??= api(`/componentes?categoria=${codigo}&limite=60&orden=nombre`).then((r) => r.resultados);
  return catalogo[codigo];
}
const opcionesHtml = (lista, vacio = '— Elige —') =>
  `<option value="">${esc(vacio)}</option>` + lista.map((p) => `<option value="${p.id}">${esc(p.nombreCompleto)} · ${dinero(p.tieneOfertas ? p.precio : p.precioReferencia)}</option>`).join('');

function miniProductos(lista) {
  return `<div class="mini-productos">${lista
    .map(
      (p) => `<a class="pieza-fila" href="/producto.html?id=${p.id}">${imagen(p.imagen, p.nombre)}
        <span><small>${esc(p.dato ?? '')}</small><b>${esc(p.nombre)}</b><em>${Object.entries(p.atributos ?? {}).slice(0, 3).map(([k, v]) => `${esc(k)}: ${esc(v)}`).join(' · ')}</em></span>
        <strong>${dinero(p.precio)}</strong></a>`,
    )
    .join('')}</div>`;
}

// ---------- Comprobador de compatibilidad ----------
$('#selects-compat').innerHTML = CATS_COMPAT.map(([c, n]) => `<label class="campo"><span>${n}</span><select name="${c}" data-cat="${c}"></select></label>`).join('');

async function comprobar() {
  const form = $('#form-compat');
  const ids = CATS_COMPAT.map(([c]) => Number(form[c].value)).filter(Boolean);
  const res = $('#res-compat');
  if (ids.length < 2) {
    res.innerHTML = '<div class="aviso alerta">Elige al menos dos piezas.</div>';
    return;
  }
  try {
    const r = await enviar('/configurador/resumen', { piezas: ids });
    const evaluadas = r.compatibilidad.resultados.filter((x) => !x.omitida);
    const ok = r.compatibilidad.esCompatible;
    res.innerHTML = `
      <div class="estado-compat ${ok ? 'ok' : 'mal'}" style="margin-bottom:14px">${icono(ok ? 'escudo' : 'alerta', 20)} ${ok ? `Compatibles (${evaluadas.length} reglas comprobadas)` : `${r.compatibilidad.errores.length} problema(s) encontrados`}</div>
      <ul class="reglas">${r.compatibilidad.resultados
        .map((x) => `<li><span class="${x.omitida ? 'omitida' : x.cumple ? 'ok' : 'mal'}">${icono(x.omitida ? 'menos' : x.cumple ? 'check' : 'x', 17)}</span><span>${esc(x.regla)}<small>${esc(x.detalle)}</small></span></li>`)
        .join('')}</ul>
      <div class="medidor dos-campos" style="margin-top:16px">
        <div class="dato"><small>Consumo estimado</small><b>${r.consumo} W</b></div>
        <div class="dato"><small>Total de hoy</small><b>${dinero(r.total)}</b></div>
      </div>
      <button class="boton secundario" id="al-configurador" style="margin-top:14px">Abrir en el configurador ${icono('flecha', 15)}</button>`;
    $('#al-configurador').addEventListener('click', () => {
      guardarPc({ ...leerPc(), ...Object.fromEntries(r.piezas.map((p) => [p.categoria, p.id])) });
      location.href = '/configurador.html';
    });
  } catch (e) {
    res.innerHTML = `<div class="aviso error">${esc(e.message)}</div>`;
  }
}
$('#form-compat').addEventListener('submit', (e) => {
  e.preventDefault();
  comprobar();
});
$('#cargar-pc').addEventListener('click', () => {
  const pc = leerPc();
  if (!Object.keys(pc).length) return aviso('Todavía no tienes piezas en el configurador', 'error');
  for (const [c] of CATS_COMPAT) if (pc[c]) $('#form-compat')[c].value = pc[c];
  comprobar();
});

// ---------- Calculadora de fuente ----------
$('#form-fuente').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const res = $('#res-fuente');
  if (!f.cpuId.value) return (res.innerHTML = '<div class="aviso alerta">Elige un procesador.</div>');
  try {
    const r = await enviar('/herramientas/fuente', {
      cpuId: Number(f.cpuId.value),
      gpuId: f.gpuId.value ? Number(f.gpuId.value) : undefined,
      modulosRam: Number(f.modulosRam.value),
      discos: Number(f.discos.value),
      ventiladores: Number(f.ventiladores.value),
      refrigeracionLiquida: f.refrigeracionLiquida.checked,
      overclock: f.overclock.checked,
    });
    const max = Math.max(...r.desglose.map((d) => d.vatios));
    res.innerHTML = `
      <div class="caja" style="background:var(--violeta-claro);border-color:var(--violeta-borde)">
        <span class="antetitulo">Fuente recomendada</span>
        <div class="resultado-grande"><strong>${r.recomendada} W</strong><span class="tenue">para un consumo de ${r.consumo} W (+${r.margen} %)</span></div>
        <p style="margin-top:6px">${esc(r.consejo)}</p>
      </div>
      <h4 style="margin:18px 0 10px">De dónde sale el consumo</h4>
      <div class="barras">${r.desglose.map((d) => `<div class="barra-h"><span>${esc(d.parte)}</span><span class="pista"><i style="width:${(d.vatios / max) * 100}%"></i></span><b>${d.vatios} W</b></div>`).join('')}</div>
      ${r.fuentes.length ? `<h4 style="margin:20px 0 10px">Fuentes que cumplen</h4>${miniProductos(r.fuentes)}` : '<div class="aviso alerta" style="margin-top:16px">No hay fuentes del catálogo con esa potencia.</div>'}`;
  } catch (er) {
    res.innerHTML = `<div class="aviso error">${esc(er.message)}</div>`;
  }
});

// ---------- Calculadora de refrigeración ----------
$('#form-refrig').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const res = $('#res-refrig');
  if (!f.cpuId.value) return (res.innerHTML = '<div class="aviso alerta">Elige un procesador.</div>');
  try {
    const r = await enviar('/herramientas/refrigeracion', {
      cpuId: Number(f.cpuId.value),
      uso: f.uso.value,
      overclock: f.overclock.checked,
      temperatura: Number(f.temperatura.value),
      caja: f.caja.value,
    });
    res.innerHTML = `
      <div class="caja" style="background:var(--violeta-claro);border-color:var(--violeta-borde)">
        <span class="antetitulo">Te recomendamos</span>
        <h3 style="font-size:22px">${esc(r.tipo.nombre)}</h3>
        <p style="margin-top:6px">${esc(r.tipo.detalle)}</p>
      </div>
      <div class="dos-campos" style="margin:14px 0">
        <div class="dato"><small>TDP de ${esc(r.procesador)}</small><b>${r.tdp} W</b></div>
        <div class="dato"><small>Calor a disipar estimado</small><b>${r.calor} W</b></div>
      </div>
      ${r.altura ? `<p class="pequeno tenue">${esc(r.altura)}</p>` : ''}
      ${r.disipadores.length ? `<h4 style="margin:12px 0 10px">Disipadores compatibles que alcanzan</h4>${miniProductos(r.disipadores)}` : '<div class="aviso alerta">Ningún disipador del catálogo alcanza; considera una refrigeración líquida de 360 mm.</div>'}`;
  } catch (er) {
    res.innerHTML = `<div class="aviso error">${esc(er.message)}</div>`;
  }
});

// Rellena todos los <select data-cat> con los modelos del catálogo
async function iniciar() {
  const selects = $$('select[data-cat]');
  await Promise.all(selects.map(async (s) => (s.innerHTML = opcionesHtml(await modelos(s.dataset.cat), s.dataset.vacio))));
  // Preselecciona lo que el visitante tenga en su PC
  const pc = leerPc();
  selects.forEach((s) => pc[s.dataset.cat] && (s.value = pc[s.dataset.cat]));
  // Sin PC propio: un ejemplo de gama media para que las calculadoras muestren algo al entrar
  const ejemplo = (s, texto) => {
    if (s.value) return;
    const o = [...s.options].find((x) => x.text.includes(texto));
    if (o) s.value = o.value;
  };
  ejemplo($('#form-fuente').cpuId, 'Ryzen 5 7600');
  ejemplo($('#form-fuente').gpuId, 'RTX 5060');
  ejemplo($('#form-refrig').cpuId, 'Ryzen 5 7600');
  $('#form-fuente').requestSubmit();
  $('#form-refrig').requestSubmit();
}
iniciar().catch((e) => aviso(e.message, 'error'));
