import { montar } from '../js/layout.js';
import { api, enviar } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, $$, aviso, dinero, esc } from '../js/util.js';
import { guardarPc, leerPc } from '../js/estado.js';
import { filaPieza } from '../js/tarjetas.js';
import { estadoCompatibilidad, listaReglas } from '../js/compatibilidad.js';

montar('herramientas');
// Íconos de la cabecera de cada herramienta
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

// Productos sugeridos por las calculadoras (fuentes o disipadores)
function miniProductos(lista) {
  return `<div class="pila pila--chica">${lista
    .map((p) => {
      const atributos = Object.entries(p.atributos ?? {}).slice(0, 3).map(([k, v]) => `${esc(k)}: ${esc(v)}`).join(' · ');
      return filaPieza({ id: p.id, foto: p.imagen, nombre: p.nombre, etiqueta: p.dato ?? '', detalle: atributos, precio: p.precio });
    })
    .join('')}</div>`;
}

// Caja violeta con el resultado principal de una calculadora
const destacado = (antetitulo, contenido) => `<div class="caja resultado">
    <span class="seccion__antetitulo">${antetitulo}</span>${contenido}</div>`;

// Dos cifras lado a lado
const dosDatos = (a, b) => `<div class="datos datos--dos herramienta__datos">
    <div class="datos__dato"><small class="datos__etiqueta">${a[0]}</small><b class="datos__valor">${a[1]}</b></div>
    <div class="datos__dato"><small class="datos__etiqueta">${b[0]}</small><b class="datos__valor">${b[1]}</b></div>
  </div>`;

// ---------- Comprobador de compatibilidad ----------
$('#selects-compat').innerHTML = CATS_COMPAT.map(
  ([c, n]) => `<label class="formulario__campo"><span class="formulario__etiqueta">${n}</span><select name="${c}" data-cat="${c}"></select></label>`,
).join('');

async function comprobar() {
  const form = $('#form-compat');
  const ids = CATS_COMPAT.map(([c]) => Number(form[c].value)).filter(Boolean);
  const res = $('#res-compat');
  if (ids.length < 2) {
    res.innerHTML = '<div class="aviso aviso--alerta">Elige al menos dos piezas.</div>';
    return;
  }
  try {
    const r = await enviar('/configurador/resumen', { piezas: ids });
    const evaluadas = r.compatibilidad.resultados.filter((x) => !x.omitida);
    const ok = r.compatibilidad.esCompatible;
    const texto = ok ? `Compatibles (${evaluadas.length} reglas comprobadas)` : `${r.compatibilidad.errores.length} problema(s) encontrados`;
    res.innerHTML = `
      <div class="pila">
        ${estadoCompatibilidad(ok ? 'ok' : 'mal', texto)}
        ${listaReglas(r.compatibilidad.resultados)}
        ${dosDatos(['Consumo estimado', `${r.consumo} W`], ['Total de hoy', dinero(r.total)])}
        <div><button class="boton boton--secundario" id="al-configurador">Abrir en el configurador ${icono('flecha', 15)}</button></div>
      </div>`;
    $('#al-configurador').addEventListener('click', () => {
      guardarPc({ ...leerPc(), ...Object.fromEntries(r.piezas.map((p) => [p.categoria, p.id])) });
      location.href = '/configurador.html';
    });
  } catch (e) {
    res.innerHTML = `<div class="aviso aviso--error">${esc(e.message)}</div>`;
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
  if (!f.cpuId.value) return (res.innerHTML = '<div class="aviso aviso--alerta">Elige un procesador.</div>');
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
    const barras = r.desglose
      .map(
        (d) => `<div class="barras__fila"><span>${esc(d.parte)}</span>
          <span class="barras__pista"><i class="barras__relleno" style="width:${(d.vatios / max) * 100}%"></i></span><b class="barras__valor">${d.vatios} W</b></div>`,
      )
      .join('');
    res.innerHTML = `
      ${destacado('Fuente recomendada', `<div class="resultado__principal"><strong class="resultado__cifra">${r.recomendada} W</strong>
        <span class="texto texto--tenue">para un consumo de ${r.consumo} W (+${r.margen} %)</span></div><p class="resultado__texto">${esc(r.consejo)}</p>`)}
      <h4 class="herramienta__subtitulo">De dónde sale el consumo</h4>
      <div class="barras">${barras}</div>
      ${r.fuentes.length ? `<h4 class="herramienta__subtitulo">Fuentes que cumplen</h4>${miniProductos(r.fuentes)}` : '<div class="aviso aviso--alerta herramienta__aviso">No hay fuentes del catálogo con esa potencia.</div>'}`;
  } catch (er) {
    res.innerHTML = `<div class="aviso aviso--error">${esc(er.message)}</div>`;
  }
});

// ---------- Calculadora de refrigeración ----------
$('#form-refrig').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const res = $('#res-refrig');
  if (!f.cpuId.value) return (res.innerHTML = '<div class="aviso aviso--alerta">Elige un procesador.</div>');
  try {
    const r = await enviar('/herramientas/refrigeracion', {
      cpuId: Number(f.cpuId.value),
      uso: f.uso.value,
      overclock: f.overclock.checked,
      temperatura: Number(f.temperatura.value),
      caja: f.caja.value,
    });
    res.innerHTML = `
      ${destacado('Te recomendamos', `<h3 class="resultado__titulo">${esc(r.tipo.nombre)}</h3><p class="resultado__texto">${esc(r.tipo.detalle)}</p>`)}
      ${dosDatos([`TDP de ${esc(r.procesador)}`, `${r.tdp} W`], ['Calor a disipar estimado', `${r.calor} W`])}
      ${r.altura ? `<p class="texto texto--pequeno texto--tenue">${esc(r.altura)}</p>` : ''}
      ${r.disipadores.length ? `<h4 class="herramienta__subtitulo">Disipadores compatibles que alcanzan</h4>${miniProductos(r.disipadores)}` : '<div class="aviso aviso--alerta">Ningún disipador del catálogo alcanza; considera una refrigeración líquida de 360 mm.</div>'}`;
  } catch (er) {
    res.innerHTML = `<div class="aviso aviso--error">${esc(er.message)}</div>`;
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
