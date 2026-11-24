// Sección "Componentes": CRUD de todas las categorías salvo procesadores.
// La categoría es una llave foránea (desplegable) y, al cambiarla, el formulario muestra
// solo los datos técnicos que esa categoría usa en las reglas de compatibilidad.
import { actualizar, api, borrar, enviar } from '../../js/api.js';
import { icono } from '../../js/iconos.js';
import { aviso, confirmar, dinero, esc, tabla } from '../../js/util.js';
import { campo, casilla, formularioModal, opciones } from './comun.js';

let catalogo = null; // { categorias, campos, zocalos } (se pide una sola vez)
let lista = [];
let filtro = ''; // código de la categoría elegida en el filtro

const cargarCatalogo = async () => (catalogo ??= await api('/admin/catalogo/campos'));

// Campo técnico según su tipo: número, una opción (desplegable) o varias (casillas)
function campoTecnico(f, valor, zocalos) {
  const lista = f.tipo === 'zocalo' || f.tipo === 'zocalos' ? zocalos : f.opciones ?? [];
  if (f.tipo === 'numero') {
    return campo(esc(f.etiqueta), `<input type="number" data-tecnico="${f.campo}" min="${f.min}" max="${f.max}" step="1" required value="${valor ?? ''}">`);
  }
  if (f.tipo === 'opcion' || f.tipo === 'zocalo') {
    return campo(esc(f.etiqueta), `<select data-tecnico="${f.campo}" required><option value="">Elige…</option>${opciones(lista.map((o) => [esc(o), esc(o)]), valor)}</select>`);
  }
  const marcados = String(valor ?? '').split(',');
  const casillas = lista.map((o) => casilla(esc(o), `data-tecnico-multiple="${f.campo}" value="${esc(o)}" ${marcados.includes(o) ? 'checked' : ''}`)).join('');
  return `<div class="formulario__campo"><span class="formulario__etiqueta">${esc(f.etiqueta)}</span><div class="fila">${casillas}</div></div>`;
}

// Lee los datos técnicos del formulario: { zocalo: 'AM5', formatosSoportados: ['ATX', 'mATX'], … }
function leerTecnicos(form) {
  const tecnicos = {};
  form.querySelectorAll('[data-tecnico]').forEach((el) => (tecnicos[el.dataset.tecnico] = el.type === 'number' ? Number(el.value) : el.value));
  form.querySelectorAll('[data-tecnico-multiple]').forEach((el) => {
    tecnicos[el.dataset.tecnicoMultiple] ??= [];
    if (el.checked) tecnicos[el.dataset.tecnicoMultiple].push(el.value);
  });
  return tecnicos;
}

async function formulario(c, recargar) {
  const { categorias, campos, zocalos } = await cargarCatalogo();
  const form = formularioModal({
    titulo: c ? `Editar ${c.marca} ${c.nombre}` : 'Nuevo componente',
    ancho: 640,
    boton: c ? 'Guardar cambios' : 'Crear componente',
    html: `
      ${campo('Categoría', `<select name="categoriaId" required><option value="">Elige una categoría…</option>
        ${categorias.map((k) => `<option value="${k.id}" data-codigo="${k.codigo}" ${c?.categoria.id === k.id ? 'selected' : ''}>${esc(k.nombre)}</option>`).join('')}</select>`)}
      <div class="formulario__dos">
        ${campo('Marca', `<input name="marca" required maxlength="40" value="${esc(c?.marca ?? '')}">`)}
        ${campo('Modelo', `<input name="nombre" required minlength="2" maxlength="80" value="${esc(c?.nombre ?? '')}">`)}
        ${campo('Precio de referencia ($)', `<input name="precio" type="number" step="0.01" min="0.01" max="100000" required value="${c?.precio ?? ''}">`)}
        ${campo('Consumo (W)', `<input name="consumoW" type="number" step="1" min="0" max="2000" required value="${c?.consumoW ?? 0}">`)}
        ${campo('Puntaje de rendimiento (0 a 100)', `<input name="puntajeRendimiento" type="number" step="1" min="0" max="100" required value="${c?.puntajeRendimiento ?? 0}">`)}
        ${campo('Texto para buscar en tiendas', `<input name="busqueda" maxlength="80" placeholder="Opcional" value="${esc(c?.busqueda ?? '')}">`)}
      </div>
      <fieldset class="formulario__grupo" id="campos-tecnicos"></fieldset>`,
    alEnviar: async (f) => {
      const cuerpo = {
        categoriaId: Number(f.categoriaId.value),
        marca: f.marca.value.trim(),
        nombre: f.nombre.value.trim(),
        precio: Number(f.precio.value),
        consumoW: Number(f.consumoW.value),
        puntajeRendimiento: Number(f.puntajeRendimiento.value),
        busqueda: f.busqueda.value.trim(),
        tecnicos: leerTecnicos(f),
      };
      if (c) await actualizar(`/admin/catalogo/${c.id}`, cuerpo, 'PUT');
      else await enviar('/admin/catalogo', cuerpo);
      aviso(c ? 'Componente actualizado' : 'Componente creado');
      recargar();
    },
  });

  // Al cambiar la categoría se dibujan sus campos técnicos
  const pintarTecnicos = () => {
    const codigo = form.categoriaId.selectedOptions[0]?.dataset.codigo;
    const lista = campos[codigo] ?? [];
    const valor = (f) => (c?.categoria.codigo === codigo ? c.tecnicos[f.campo] : null);
    form.querySelector('#campos-tecnicos').innerHTML = !codigo
      ? '<p class="formulario__ayuda">Elige la categoría para ver sus datos técnicos.</p>'
      : lista.length
        ? `<legend class="formulario__leyenda">Datos técnicos de compatibilidad</legend>${lista.map((f) => campoTecnico(f, valor(f), zocalos)).join('')}`
        : '<p class="formulario__ayuda">Esta categoría no usa datos técnicos en las reglas de compatibilidad.</p>';
  };
  form.categoriaId.addEventListener('change', pintarTecnicos);
  pintarTecnicos();
}

export default {
  titulo: 'Componentes',
  icono: 'pc',
  permiso: 'componentes.gestionar',

  async html() {
    const { categorias, campos } = await cargarCatalogo();
    lista = await api(`/admin/catalogo${filtro ? `?categoria=${filtro}` : ''}`);
    // Resumen de los datos técnicos en pastillas pequeñas
    const tecnicos = (c) =>
      (campos[c.categoria.codigo] ?? [])
        .map((f) => `<span class="datos-tecnicos__dato">${esc(f.etiqueta.split(' (')[0])}: <b class="datos-tecnicos__valor">${esc(String(c.tecnicos[f.campo] ?? '—'))}</b></span>`)
        .join('');
    const filas = lista.map((c) => [
      `<b>${esc(c.marca)} ${esc(c.nombre)}</b><small class="tabla__detalle">${c.consumoW} W · puntaje ${c.puntajeRendimiento}</small>`,
      esc(c.categoria.nombre),
      [dinero(c.precio), 'derecha'],
      `<div class="datos-tecnicos">${tecnicos(c) || '<span class="texto texto--tenue texto--pequeno">No aplica</span>'}</div>`,
      [`<button class="enlace" data-editar="${c.id}">Editar</button> · <button class="enlace enlace--peligro" data-borrar="${c.id}">Eliminar</button>`, 'derecha corta'],
    ]);
    return `
      <div class="fila fila--entre panel__bloque">
        <select class="formulario__corto" id="filtro-categoria">
          <option value="">Todas las categorías</option>${opciones(categorias.map((c) => [c.codigo, esc(c.nombre)]), filtro)}
        </select>
        <button class="boton boton--violeta" data-nuevo>${icono('mas', 16)} Nuevo componente</button>
      </div>
      <p class="texto texto--tenue texto--pequeno panel__bloque">${lista.length} componente(s). Los procesadores están en su propia sección.</p>
      ${tabla(['Componente', 'Categoría', ['Precio ref.', 'derecha'], 'Datos técnicos', ''], filas)}`;
  },

  conectar(zona, { recargar }) {
    zona.querySelector('#filtro-categoria').addEventListener('change', (e) => {
      filtro = e.target.value;
      recargar();
    });
    zona.addEventListener('click', async (e) => {
      if (e.target.closest('[data-nuevo]')) return formulario(null, recargar);
      const editar = e.target.closest('[data-editar]');
      if (editar) return formulario(lista.find((x) => x.id === Number(editar.dataset.editar)), recargar);
      const quitar = e.target.closest('[data-borrar]');
      if (!quitar || !(await confirmar({ titulo: '¿Eliminar este componente?', mensaje: 'También se borran sus precios y reseñas. No se puede deshacer.' }))) return;
      try {
        await borrar(`/admin/catalogo/${quitar.dataset.borrar}`);
        aviso('Componente eliminado');
        recargar();
      } catch (er) {
        aviso(er.message, 'error');
      }
    });
  },
};
