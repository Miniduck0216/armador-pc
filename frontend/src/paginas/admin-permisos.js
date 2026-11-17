// Roles y permisos del panel (diseño basado en la pantalla «Privilegios» de Omnium 3).
// 1) Contexto de asignación: se elige el rol o la persona a la que se le asignan permisos.
// 2) Árbol de permisos: un nodo por módulo con sus permisos; la casilla del módulo marca
//    o desmarca toda la rama y queda a medias (indeterminada) si solo hay algunos.
// 3) Resumen: los cambios quedan pendientes y solo se envían al pulsar «Guardar cambios».
import { actualizar, api, borrar } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { aviso, confirmar, esc } from '../js/util.js';

const estado = {
  modo: 'rol', // 'rol' | 'usuario'
  catalogo: [], // [{codigo, nombre, modulo}]
  roles: [],
  rolId: null,
  usuario: null, // {id, nombre, correo, rol, esAdmin}
  delRol: new Set(), // permisos que la persona recibe por su rol
  guardados: new Set(), // lo que está en la base de datos
  marcados: new Set(), // lo que se ve marcado en pantalla
  bloqueo: '', // motivo por el que no se puede editar
  abiertas: new Set(),
  filtro: '',
  guardando: false,
  yo: null,
};

let raiz = null;
let onCambiarSeccion = null;

const modulos = () => [...new Set(estado.catalogo.map((p) => p.modulo))];
const permisosDe = (m) => estado.catalogo.filter((p) => p.modulo === m);
const normalizar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const nombreDe = (codigo) => estado.catalogo.find((p) => p.codigo === codigo)?.nombre ?? codigo;
const rolActual = () => estado.roles.find((r) => r.id === estado.rolId);

function cambios() {
  const agregados = [...estado.marcados].filter((c) => !estado.guardados.has(c));
  const quitados = [...estado.guardados].filter((c) => !estado.marcados.has(c));
  return { agregados, quitados, total: agregados.length + quitados.length };
}

// Antes de cambiar de rol, de persona o de pestaña se avisa si hay cambios sin guardar
async function puedeSalir() {
  const { total } = cambios();
  if (!total) return true;
  return confirmar({
    titulo: '¿Descartar los cambios?',
    mensaje: `Tienes ${total} cambio(s) sin guardar en los permisos.`,
    boton: 'Descartar',
    peligro: true,
  });
}

// ---------- HTML ----------
export async function htmlRolesPermisos({ yo, alCambiar }) {
  estado.yo = yo;
  onCambiarSeccion = alCambiar;
  const d = await api('/admin/roles');
  estado.catalogo = d.permisos;
  estado.roles = d.roles;
  if (!estado.roles.some((r) => r.id === estado.rolId)) estado.rolId = (estado.roles.find((r) => !r.bloqueado) ?? estado.roles[0])?.id ?? null;
  if (!estado.abiertas.size) modulos().forEach((m) => estado.abiertas.add(m));
  return `<div id="permisos-app">
    <div class="pestanas" role="tablist">
      <button class="pestanas__boton ${estado.modo === 'rol' ? 'pestanas__boton--activa' : ''}" role="tab" data-pestana="rol">${icono('escudo', 16)} Por rol</button>
      <button class="pestanas__boton ${estado.modo === 'usuario' ? 'pestanas__boton--activa' : ''}" role="tab" data-pestana="usuario">${icono('usuario', 16)} Por usuario</button>
    </div>
    <section class="contexto-permisos" id="contexto-permisos"></section>
    <div id="zona-permisos"></div>
  </div>`;
}

function htmlContextoRol() {
  const r = rolActual();
  return `
    <div class="contexto-permisos__cabecera">
      <div>
        <h3 class="contexto-permisos__titulo">Contexto de asignación</h3>
        <p class="contexto-permisos__ayuda">Elige un rol y marca en el árbol lo que pueden hacer todas las personas que lo tienen.</p>
      </div>
      <div class="contexto-permisos__chips">
        <span class="contexto-permisos__chip">Rol: <b>${esc(r?.nombre ?? 'Sin seleccionar')}</b></span>
        <span class="contexto-permisos__chip">Usuarios: <b>${r?.usuarios ?? 0}</b></span>
        <span class="contexto-permisos__chip">Tipo: <b>${r?.sistema ? 'Del sistema' : 'Personalizado'}</b></span>
      </div>
    </div>
    <div class="contexto-permisos__campos">
      <label class="campo"><span>Rol</span>
        <select id="elegir-rol">${estado.roles.map((x) => `<option value="${x.id}" ${x.id === estado.rolId ? 'selected' : ''}>${esc(x.nombre)}</option>`).join('')}</select>
      </label>
      <div class="campo contexto-permisos__dato"><span>Descripción</span><output>${esc(r?.descripcion || 'Sin descripción')}</output></div>
      <div class="contexto-permisos__acciones">
        <button class="boton violeta" data-rol-nuevo>${icono('mas', 16)} Nuevo rol</button>
        ${r && !r.sistema ? `<button class="boton secundario" data-rol-borrar="${r.id}">${icono('basura', 16)} Eliminar</button>` : ''}
      </div>
    </div>`;
}

function htmlContextoUsuario() {
  const u = estado.usuario;
  return `
    <div class="contexto-permisos__cabecera">
      <div>
        <h3 class="contexto-permisos__titulo">Contexto de asignación</h3>
        <p class="contexto-permisos__ayuda">Busca a una persona. Se parte de los permisos de su rol; lo que marques o desmarques solo cambia para ella.</p>
      </div>
      <div class="contexto-permisos__chips">
        <span class="contexto-permisos__chip">Usuario: <b>${esc(u?.nombre ?? 'Sin seleccionar')}</b></span>
        <span class="contexto-permisos__chip">Rol: <b>${esc(u?.rol ?? '—')}</b></span>
      </div>
    </div>
    <div class="contexto-permisos__campos">
      <div class="campo buscador-usuario">
        <span>Usuario</span>
        <div class="buscador-usuario__caja">${icono('buscar', 16)}
          <input type="search" id="buscar-usuario" placeholder="Buscar por nombre o correo…" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="lista-usuarios">
        </div>
        <div class="buscador-usuario__lista oculto" id="lista-usuarios" role="listbox"></div>
      </div>
      <div class="campo contexto-permisos__dato"><span>Usuario seleccionado</span><output>${esc(u?.nombre ?? 'Sin usuario seleccionado')}</output></div>
      <div class="campo contexto-permisos__dato"><span>Correo</span><output>${esc(u?.correo ?? 'Sin correo')}</output></div>
    </div>`;
}

function htmlArbol() {
  const texto = normalizar(estado.filtro);
  const visibles = (m) => permisosDe(m).filter((p) => !texto || normalizar(`${p.nombre} ${p.codigo} ${m}`).includes(texto));
  const ramas = modulos()
    .filter((m) => visibles(m).length)
    .map((m) => {
      const todos = permisosDe(m);
      const marcados = todos.filter((p) => estado.marcados.has(p.codigo)).length;
      const nivel = marcados === todos.length ? 'completo' : marcados ? 'parcial' : 'vacio';
      const abierta = texto || estado.abiertas.has(m);
      return `<div class="arbol-permisos__rama ${abierta ? 'arbol-permisos__rama--abierta' : ''}" role="treeitem" aria-expanded="${!!abierta}">
        <div class="arbol-permisos__fila arbol-permisos__fila--modulo" data-alternar-rama="${esc(m)}">
          <button type="button" class="arbol-permisos__flecha" aria-label="${abierta ? 'Contraer' : 'Expandir'} ${esc(m)}">${icono('abajo', 14)}</button>
          <input type="checkbox" data-marcar-rama="${esc(m)}" ${nivel === 'completo' ? 'checked' : ''} data-indeterminada="${nivel === 'parcial'}"
            ${estado.bloqueo ? 'disabled' : ''} aria-label="Marcar todo el módulo ${esc(m)}">
          <span class="arbol-permisos__nombre">${esc(m)}</span>
          <span class="arbol-permisos__marca arbol-permisos__marca--${nivel}">${marcados}/${todos.length}</span>
        </div>
        <div class="arbol-permisos__hijos" role="group">${visibles(m).map(htmlPermiso).join('')}</div>
      </div>`;
    })
    .join('');
  return ramas || '<p class="arbol-permisos__sin-resultados">Ningún permiso coincide con la búsqueda.</p>';
}

function htmlPermiso(p) {
  const marcado = estado.marcados.has(p.codigo);
  const cambiado = marcado !== estado.guardados.has(p.codigo);
  let etiqueta = '';
  if (estado.modo === 'usuario') {
    const delRol = estado.delRol.has(p.codigo);
    if (marcado && !delRol) etiqueta = '<span class="arbol-permisos__marca arbol-permisos__marca--agregado">Agregado</span>';
    else if (!marcado && delRol) etiqueta = '<span class="arbol-permisos__marca arbol-permisos__marca--quitado">Quitado</span>';
    else if (delRol) etiqueta = '<span class="arbol-permisos__marca arbol-permisos__marca--rol">Por su rol</span>';
  }
  return `<label class="arbol-permisos__fila arbol-permisos__fila--permiso ${cambiado ? 'arbol-permisos__fila--cambiado' : ''}">
    <input type="checkbox" data-marcar-permiso="${esc(p.codigo)}" ${marcado ? 'checked' : ''} ${estado.bloqueo ? 'disabled' : ''}>
    <span class="arbol-permisos__nombre">${esc(p.nombre)}<small>${esc(p.codigo)}</small></span>${etiqueta}
  </label>`;
}

function htmlZona() {
  if (estado.modo === 'usuario' && !estado.usuario) {
    return `<div class="asignar-permisos__vacio">${icono('usuario', 30)}<p>Busca y elige a una persona para ver y ajustar sus permisos.</p></div>`;
  }
  const total = estado.catalogo.length;
  const leyenda = estado.modo === 'usuario'
    ? `<span class="arbol-permisos__leyenda">
        <span class="arbol-permisos__marca arbol-permisos__marca--rol">Por su rol</span>
        <span class="arbol-permisos__marca arbol-permisos__marca--agregado">Agregado</span>
        <span class="arbol-permisos__marca arbol-permisos__marca--quitado">Quitado</span></span>`
    : '';
  return `<div class="asignar-permisos">
    <section class="arbol-permisos">
      <div class="arbol-permisos__cabecera">
        <div>
          <h3 class="arbol-permisos__titulo">Árbol de permisos</h3>
          <p class="arbol-permisos__ayuda">Marca un módulo completo o permisos sueltos.</p>
        </div>
        <div class="contexto-permisos__acciones">
          <button type="button" class="boton secundario pequeno" data-todo="si" ${estado.bloqueo ? 'disabled' : ''}>Marcar todo</button>
          <button type="button" class="boton secundario pequeno" data-todo="no" ${estado.bloqueo ? 'disabled' : ''}>Desmarcar todo</button>
        </div>
      </div>
      ${estado.bloqueo ? `<div class="aviso alerta pequeno" style="margin-top:12px">${estado.bloqueo}</div>` : ''}
      <div class="arbol-permisos__herramientas">
        <span class="arbol-permisos__total" id="total-permisos">${estado.marcados.size} de ${total} seleccionados</span>
        <button type="button" class="arbol-permisos__enlace" data-ramas="abrir">Expandir todo</button>
        <button type="button" class="arbol-permisos__enlace" data-ramas="cerrar">Contraer todo</button>
        ${leyenda}
      </div>
      <div class="arbol-permisos__buscar">
        <label for="buscar-permiso">Buscar permiso</label>
        <input type="search" id="buscar-permiso" placeholder="Nombre, código o módulo…" value="${esc(estado.filtro)}" autocomplete="off">
      </div>
      <div class="arbol-permisos__lista" id="arbol" role="tree" aria-label="Permisos">${htmlArbol()}</div>
    </section>
    <aside class="resumen-permisos" id="resumen-permisos">${htmlResumen()}</aside>
  </div>`;
}

function htmlResumen() {
  const { agregados, quitados, total } = cambios();
  const sujeto = estado.modo === 'rol' ? `Rol ${rolActual()?.nombre ?? ''}` : estado.usuario?.nombre ?? '';
  const lista = (codigos, signo, clase) => codigos.map((c) => `<li><span class="resumen-permisos__signo resumen-permisos__signo--${clase}">${signo}</span>${esc(nombreDe(c))}</li>`).join('');
  return `
    <div class="resumen-permisos__cabecera">
      <div>
        <h3 class="resumen-permisos__titulo">Cambios</h3>
        <p class="resumen-permisos__sujeto">${esc(sujeto)}</p>
      </div>
      <span class="resumen-permisos__estado ${total ? 'resumen-permisos__estado--pendiente' : ''}">${estado.guardando ? 'Guardando…' : total ? `${total} pendiente(s)` : 'Sin cambios'}</span>
    </div>
    <div class="resumen-permisos__grupo">
      ${total
        ? `${agregados.length ? `<h4>Se agregan</h4><ul>${lista(agregados, '+', 'mas')}</ul>` : ''}
           ${quitados.length ? `<h4 ${agregados.length ? 'style="margin-top:12px"' : ''}>Se quitan</h4><ul>${lista(quitados, '−', 'menos')}</ul>` : ''}`
        : '<p class="resumen-permisos__vacio">Marca o desmarca permisos en el árbol. Los cambios aparecen aquí antes de guardarse.</p>'}
    </div>
    <div class="resumen-permisos__pie">
      <div class="resumen-permisos__cuenta"><span>Cambios por aplicar</span><b>${total}</b></div>
      <div class="resumen-permisos__botones">
        <button type="button" class="boton violeta ${estado.guardando ? 'boton--cargando' : ''}" data-guardar-permisos ${!total || estado.guardando ? 'disabled' : ''}>${icono('guardar', 16)} Guardar cambios</button>
        <button type="button" class="boton secundario" data-descartar ${!total || estado.guardando ? 'disabled' : ''}>Descartar</button>
      </div>
    </div>`;
}

// ---------- Pintado ----------
function pintarContexto() {
  raiz.querySelector('#contexto-permisos').innerHTML = estado.modo === 'rol' ? htmlContextoRol() : htmlContextoUsuario();
}

function pintarZona() {
  raiz.querySelector('#zona-permisos').innerHTML = htmlZona();
  ajustarIndeterminadas();
}

// Solo se repinta el árbol y el resumen: así el buscador no pierde el foco
function pintarArbol() {
  const arbol = raiz.querySelector('#arbol');
  if (!arbol) return;
  arbol.innerHTML = htmlArbol();
  raiz.querySelector('#total-permisos').textContent = `${estado.marcados.size} de ${estado.catalogo.length} seleccionados`;
  raiz.querySelector('#resumen-permisos').innerHTML = htmlResumen();
  ajustarIndeterminadas();
}

// La casilla "a medias" no existe en HTML: se activa con la propiedad indeterminate
function ajustarIndeterminadas() {
  raiz.querySelectorAll('[data-indeterminada]').forEach((c) => (c.indeterminate = c.dataset.indeterminada === 'true'));
}

// ---------- Carga de datos ----------
function cargarRol() {
  const r = rolActual();
  estado.guardados = new Set(r?.permisos ?? []);
  estado.marcados = new Set(estado.guardados);
  estado.bloqueo = r?.bloqueado ? 'El rol <b>Administrador</b> tiene acceso total: siempre conserva todos los permisos y no se puede editar.' : '';
}

async function cargarUsuario(id) {
  const d = await api(`/admin/permisos-usuarios/${id}`);
  estado.usuario = d.usuario;
  estado.delRol = new Set(d.permisos.filter((p) => p.delRol).map((p) => p.codigo));
  estado.guardados = new Set(d.permisos.filter((p) => p.efectivo).map((p) => p.codigo));
  estado.marcados = new Set(estado.guardados);
  estado.bloqueo = d.usuario.esAdmin
    ? `<b>${esc(d.usuario.nombre)}</b> es Administrador: tiene acceso total a todos los módulos. No hace falta marcar permisos.`
    : d.usuario.id === estado.yo?.id ? 'No puedes cambiar tus propios permisos. Pide a otro administrador que lo haga.' : '';
}

async function buscarUsuarios(texto) {
  const lista = raiz.querySelector('#lista-usuarios');
  const caja = raiz.querySelector('#buscar-usuario');
  const usuarios = await api(`/admin/permisos-usuarios?buscar=${encodeURIComponent(texto)}`);
  lista.innerHTML = usuarios.length
    ? usuarios.map((u) => `<button type="button" class="buscador-usuario__opcion" role="option" data-elegir-usuario="${u.id}">
        <b>${esc(u.nombre)}</b><small>${esc(u.correo)} · ${esc(u.rol)}</small></button>`).join('')
    : '<p class="buscador-usuario__vacio">Sin resultados.</p>';
  lista.classList.remove('oculto');
  caja.setAttribute('aria-expanded', 'true');
}

function cerrarLista() {
  raiz?.querySelector('#lista-usuarios')?.classList.add('oculto');
  raiz?.querySelector('#buscar-usuario')?.setAttribute('aria-expanded', 'false');
}

// ---------- Guardar ----------
async function guardar() {
  const { total } = cambios();
  if (!total || estado.bloqueo) return;
  estado.guardando = true;
  raiz.querySelector('#resumen-permisos').innerHTML = htmlResumen();
  const permisos = [...estado.marcados];
  try {
    if (estado.modo === 'rol') {
      await actualizar(`/admin/roles/${estado.rolId}/permisos`, { permisos }, 'PUT');
      rolActual().permisos = permisos;
      aviso(`Se guardaron ${total} cambio(s) del rol ${rolActual().nombre}`);
    } else {
      const r = await actualizar(`/admin/permisos-usuarios/${estado.usuario.id}`, { permisos }, 'PUT');
      aviso(`Permisos de ${estado.usuario.nombre} guardados (${r.agregados} agregado(s) y ${r.quitados} quitado(s) frente a su rol)`);
    }
    estado.guardados = new Set(permisos);
  } catch (er) {
    aviso(er.message, 'error');
  } finally {
    estado.guardando = false;
    pintarArbol();
  }
}

// ---------- Eventos ----------
function alternarCodigos(codigos, si) {
  codigos.forEach((c) => (si ? estado.marcados.add(c) : estado.marcados.delete(c)));
  pintarArbol();
}

async function alClic(e) {
  const t = e.target;
  const pestana = t.closest('[data-pestana]');
  if (pestana) {
    if (pestana.dataset.pestana === estado.modo || !(await puedeSalir())) return;
    estado.modo = pestana.dataset.pestana;
    estado.filtro = '';
    if (estado.modo === 'rol') cargarRol();
    else if (estado.usuario) await cargarUsuario(estado.usuario.id);
    else {
      estado.marcados = new Set();
      estado.guardados = new Set();
    }
    raiz.querySelectorAll('[data-pestana]').forEach((b) => b.classList.toggle('pestanas__boton--activa', b === pestana));
    pintarContexto();
    pintarZona();
    return;
  }

  const elegido = t.closest('[data-elegir-usuario]');
  if (elegido) {
    cerrarLista();
    if (!(await puedeSalir())) return;
    try {
      await cargarUsuario(Number(elegido.dataset.elegirUsuario));
      pintarContexto();
      pintarZona();
    } catch (er) {
      aviso(er.message, 'error');
    }
    return;
  }
  if (!t.closest('.buscador-usuario')) cerrarLista();

  // Flecha o nombre del módulo: abre o cierra la rama (la casilla no)
  const rama = t.closest('[data-alternar-rama]');
  if (rama && !t.matches('input')) {
    const m = rama.dataset.alternarRama;
    estado.abiertas.has(m) ? estado.abiertas.delete(m) : estado.abiertas.add(m);
    return pintarArbol();
  }
  const ramas = t.closest('[data-ramas]');
  if (ramas) {
    estado.abiertas = ramas.dataset.ramas === 'abrir' ? new Set(modulos()) : new Set();
    return pintarArbol();
  }
  const todo = t.closest('[data-todo]');
  if (todo) return alternarCodigos(estado.catalogo.map((p) => p.codigo), todo.dataset.todo === 'si');
  if (t.closest('[data-descartar]')) {
    estado.marcados = new Set(estado.guardados);
    return pintarArbol();
  }
  if (t.closest('[data-guardar-permisos]')) return guardar();

  const borrarRol = t.closest('[data-rol-borrar]');
  if (borrarRol) {
    const r = rolActual();
    const ok = await confirmar({
      titulo: `¿Eliminar el rol ${r.nombre}?`,
      mensaje: r.usuarios ? `Hoy lo tienen ${r.usuarios} usuario(s): primero cámbiales el rol.` : 'Se borrará el rol y sus permisos.',
      boton: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    try {
      await borrar(`/admin/roles/${r.id}`);
      aviso('Rol eliminado');
      estado.rolId = null;
      onCambiarSeccion?.();
    } catch (er) {
      aviso(er.message, 'error');
    }
  }
}

async function alCambiar(e) {
  const t = e.target;
  if (t.id === 'elegir-rol') {
    if (!(await puedeSalir())) {
      t.value = estado.rolId;
      return;
    }
    estado.rolId = Number(t.value);
    cargarRol();
    pintarContexto();
    pintarZona();
  } else if (t.dataset.marcarRama) {
    alternarCodigos(permisosDe(t.dataset.marcarRama).map((p) => p.codigo), t.checked);
  } else if (t.dataset.marcarPermiso) {
    alternarCodigos([t.dataset.marcarPermiso], t.checked);
  }
}

function alEscribir(e) {
  const t = e.target;
  if (t.id === 'buscar-permiso') {
    estado.filtro = t.value;
    pintarArbol();
  } else if (t.id === 'buscar-usuario') {
    clearTimeout(t._espera);
    t._espera = setTimeout(() => buscarUsuarios(t.value.trim()).catch((er) => aviso(er.message, 'error')), 220);
  }
}

// Se llama después de insertar el HTML de la sección en la página
export function montarRolesPermisos() {
  raiz = document.querySelector('#permisos-app');
  if (!raiz) return;
  if (estado.modo === 'rol') cargarRol();
  pintarContexto();
  pintarZona();
  raiz.addEventListener('click', (e) => alClic(e).catch((er) => aviso(er.message, 'error')));
  raiz.addEventListener('change', (e) => alCambiar(e).catch((er) => aviso(er.message, 'error')));
  raiz.addEventListener('input', alEscribir);
  // Al enfocar el buscador se muestran las primeras personas sin tener que escribir
  raiz.addEventListener('focusin', (e) => {
    if (e.target.id === 'buscar-usuario') buscarUsuarios(e.target.value.trim()).catch(() => {});
  });
  raiz.addEventListener('keydown', (e) => e.key === 'Escape' && cerrarLista());
}

// Avisa al salir de la sección o de la página si quedaron cambios sin guardar
export const hayCambiosPendientes = () => !!raiz?.isConnected && cambios().total > 0;
export { puedeSalir as confirmarSalidaPermisos };

// Después de crear un rol, el árbol se abre con ese rol elegido
export function elegirRol(id) {
  estado.rolId = id;
}
