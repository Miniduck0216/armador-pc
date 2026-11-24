// VISTA de Roles y permisos: funciones que reciben el estado y devuelven HTML.
// No piden datos ni escuchan clics (eso es del modelo y del controlador).
import { icono } from '../../../js/iconos.js';
import { esc } from '../../../js/util.js';
import { cambios, estado, modulos, nivelDe, nombreDe, permisosVisibles, rolActual } from './modelo.js';

// Pastilla de información (rol, usuarios, tipo…)
const pastilla = (etiqueta, valor) => `<span class="contexto-permisos__chip">${etiqueta}: <b>${esc(valor)}</b></span>`;
// Dato de solo lectura con su etiqueta
const dato = (etiqueta, valor) =>
  `<div class="formulario__campo"><span class="formulario__etiqueta">${etiqueta}</span><output class="contexto-permisos__dato">${esc(valor)}</output></div>`;

export function pestanas() {
  const boton = (modo, ico, texto) =>
    `<button class="pestanas__boton ${estado.modo === modo ? 'pestanas__boton--activa' : ''}" role="tab" data-pestana="${modo}">${icono(ico, 16)} ${texto}</button>`;
  return `<div class="pestanas pestanas--gris" role="tablist">${boton('rol', 'escudo', 'Por rol')}${boton('usuario', 'usuario', 'Por usuario')}</div>`;
}

// ---------- 1. Contexto de asignación (a quién se le asignan los permisos) ----------
function cabeceraContexto(ayuda, pastillas) {
  return `<div class="contexto-permisos__cabecera">
      <div><h3 class="contexto-permisos__titulo">Contexto de asignación</h3><p class="contexto-permisos__ayuda">${ayuda}</p></div>
      <div class="contexto-permisos__chips">${pastillas}</div>
    </div>`;
}

export function contextoRol() {
  const r = rolActual();
  const roles = estado.roles.map((x) => `<option value="${x.id}" ${x.id === estado.rolId ? 'selected' : ''}>${esc(x.nombre)}</option>`).join('');
  return `
    ${cabeceraContexto(
      'Elige un rol y marca en el árbol lo que pueden hacer todas las personas que lo tienen.',
      pastilla('Rol', r?.nombre ?? 'Sin seleccionar') + pastilla('Usuarios', r?.usuarios ?? 0) + pastilla('Tipo', r?.sistema ? 'Del sistema' : 'Personalizado'),
    )}
    <div class="contexto-permisos__campos">
      <label class="formulario__campo"><span class="formulario__etiqueta">Rol</span><select id="elegir-rol">${roles}</select></label>
      ${dato('Descripción', r?.descripcion || 'Sin descripción')}
      <div class="fila">
        <button class="boton boton--violeta" data-rol-nuevo>${icono('mas', 16)} Nuevo rol</button>
        ${r && !r.sistema ? `<button class="boton boton--secundario" data-rol-borrar>${icono('basura', 16)} Eliminar</button>` : ''}
      </div>
    </div>`;
}

export function contextoUsuario() {
  const u = estado.usuario;
  return `
    ${cabeceraContexto(
      'Busca a una persona. Se parte de los permisos de su rol; lo que marques o desmarques solo cambia para ella.',
      pastilla('Usuario', u?.nombre ?? 'Sin seleccionar') + pastilla('Rol', u?.rol ?? '—'),
    )}
    <div class="contexto-permisos__campos">
      <div class="formulario__campo buscador-usuario">
        <span class="formulario__etiqueta">Usuario</span>
        <div class="buscador-usuario__caja">${icono('buscar', 16, 'buscador-usuario__icono')}
          <input class="buscador-usuario__campo" type="search" id="buscar-usuario" placeholder="Buscar por nombre o correo…" autocomplete="off"
            role="combobox" aria-expanded="false" aria-controls="lista-usuarios">
        </div>
        <div class="buscador-usuario__lista" id="lista-usuarios" role="listbox" hidden></div>
      </div>
      ${dato('Usuario seleccionado', u?.nombre ?? 'Sin usuario seleccionado')}
      ${dato('Correo', u?.correo ?? 'Sin correo')}
    </div>`;
}

export function resultadosUsuarios(usuarios) {
  if (!usuarios.length) return '<p class="buscador-usuario__vacio">Sin resultados.</p>';
  return usuarios
    .map(
      (u) => `<button type="button" class="buscador-usuario__opcion" role="option" data-elegir-usuario="${u.id}">
        <b>${esc(u.nombre)}</b><small class="buscador-usuario__detalle">${esc(u.correo)} · ${esc(u.rol)}</small></button>`,
    )
    .join('');
}

// ---------- 2. Árbol de permisos (un nodo por módulo) ----------
function etiquetaPermiso(codigo, marcado) {
  if (estado.modo !== 'usuario') return '';
  const delRol = estado.delRol.has(codigo);
  if (marcado && !delRol) return '<span class="arbol-permisos__marca arbol-permisos__marca--agregado">Agregado</span>';
  if (!marcado && delRol) return '<span class="arbol-permisos__marca arbol-permisos__marca--quitado">Quitado</span>';
  if (delRol) return '<span class="arbol-permisos__marca arbol-permisos__marca--rol">Por su rol</span>';
  return '';
}

function permiso(p) {
  const marcado = estado.marcados.has(p.codigo);
  const cambiado = marcado !== estado.guardados.has(p.codigo);
  return `<label class="arbol-permisos__fila arbol-permisos__fila--permiso ${cambiado ? 'arbol-permisos__fila--cambiado' : ''}">
      <input type="checkbox" data-marcar-permiso="${esc(p.codigo)}" ${marcado ? 'checked' : ''} ${estado.bloqueo ? 'disabled' : ''}>
      <span class="arbol-permisos__nombre">${esc(p.nombre)}<small class="arbol-permisos__codigo">${esc(p.codigo)}</small></span>
      ${etiquetaPermiso(p.codigo, marcado)}
    </label>`;
}

function rama(modulo) {
  const visibles = permisosVisibles(modulo);
  if (!visibles.length) return '';
  const { nivel, marcados, total } = nivelDe(modulo);
  const abierta = estado.filtro || estado.abiertas.has(modulo);
  // La casilla del módulo marca toda la rama; "data-indeterminada" la deja a medias (ver controlador)
  return `<div class="arbol-permisos__rama ${abierta ? 'arbol-permisos__rama--abierta' : ''}" role="treeitem" aria-expanded="${!!abierta}">
      <div class="arbol-permisos__fila arbol-permisos__fila--modulo" data-alternar-rama="${esc(modulo)}">
        <button type="button" class="arbol-permisos__flecha" aria-label="${abierta ? 'Contraer' : 'Expandir'} ${esc(modulo)}">${icono('abajo', 14)}</button>
        <input type="checkbox" data-marcar-rama="${esc(modulo)}" ${nivel === 'completo' ? 'checked' : ''} data-indeterminada="${nivel === 'parcial'}"
          ${estado.bloqueo ? 'disabled' : ''} aria-label="Marcar todo el módulo ${esc(modulo)}">
        <span class="arbol-permisos__nombre">${esc(modulo)}</span>
        <span class="arbol-permisos__marca arbol-permisos__marca--${nivel}">${marcados}/${total}</span>
      </div>
      <div class="arbol-permisos__hijos" role="group">${visibles.map(permiso).join('')}</div>
    </div>`;
}

export function arbol() {
  return modulos().map(rama).join('') || '<p class="arbol-permisos__sin-resultados">Ningún permiso coincide con la búsqueda.</p>';
}

export const totalMarcados = () => `${estado.marcados.size} de ${estado.catalogo.length} seleccionados`;

// ---------- 3. Resumen con los cambios pendientes ----------
export function resumen() {
  const { agregados, quitados, total } = cambios();
  const sujeto = estado.modo === 'rol' ? `Rol ${rolActual()?.nombre ?? ''}` : estado.usuario?.nombre ?? '';
  const lista = (titulo, codigos, signo, tipo) =>
    codigos.length
      ? `<h4 class="resumen-permisos__subtitulo">${titulo}</h4><ul class="resumen-permisos__lista">${codigos
          .map((c) => `<li class="resumen-permisos__item"><span class="resumen-permisos__signo resumen-permisos__signo--${tipo}">${signo}</span>${esc(nombreDe(c))}</li>`)
          .join('')}</ul>`
      : '';
  const estadoTexto = estado.guardando ? 'Guardando…' : total ? `${total} pendiente(s)` : 'Sin cambios';
  const sinCambios = !total || estado.guardando;
  return `
    <div class="resumen-permisos__cabecera">
      <div><h3 class="resumen-permisos__titulo">Cambios</h3><p class="resumen-permisos__sujeto">${esc(sujeto)}</p></div>
      <span class="resumen-permisos__estado ${total ? 'resumen-permisos__estado--pendiente' : ''}">${estadoTexto}</span>
    </div>
    <div class="resumen-permisos__grupo">
      ${total ? lista('Se agregan', agregados, '+', 'mas') + lista('Se quitan', quitados, '−', 'menos') : '<p class="resumen-permisos__vacio">Marca o desmarca permisos en el árbol. Los cambios aparecen aquí antes de guardarse.</p>'}
    </div>
    <div class="resumen-permisos__pie">
      <div class="resumen-permisos__cuenta"><span>Cambios por aplicar</span><b>${total}</b></div>
      <div class="pila pila--chica">
        <button type="button" class="boton boton--violeta ${estado.guardando ? 'boton--cargando' : ''}" data-guardar ${sinCambios ? 'disabled' : ''}>${icono('guardar', 16)} Guardar cambios</button>
        <button type="button" class="boton boton--secundario" data-descartar ${sinCambios ? 'disabled' : ''}>Descartar</button>
      </div>
    </div>`;
}

// ---------- Zona de trabajo: árbol a la izquierda, resumen a la derecha ----------
export function zona() {
  if (estado.modo === 'usuario' && !estado.usuario) {
    return `<div class="asignar-permisos__vacio">${icono('usuario', 30, 'asignar-permisos__icono')}<p>Busca y elige a una persona para ver y ajustar sus permisos.</p></div>`;
  }
  const leyenda =
    estado.modo === 'usuario'
      ? `<span class="arbol-permisos__leyenda">
          <span class="arbol-permisos__marca arbol-permisos__marca--rol">Por su rol</span>
          <span class="arbol-permisos__marca arbol-permisos__marca--agregado">Agregado</span>
          <span class="arbol-permisos__marca arbol-permisos__marca--quitado">Quitado</span></span>`
      : '';
  const bloqueado = estado.bloqueo ? 'disabled' : '';
  return `<div class="asignar-permisos">
    <section class="arbol-permisos">
      <div class="arbol-permisos__cabecera">
        <div><h3 class="arbol-permisos__titulo">Árbol de permisos</h3><p class="arbol-permisos__ayuda">Marca un módulo completo o permisos sueltos.</p></div>
        <div class="fila fila--chica">
          <button type="button" class="boton boton--secundario boton--pequeno" data-todo="si" ${bloqueado}>Marcar todo</button>
          <button type="button" class="boton boton--secundario boton--pequeno" data-todo="no" ${bloqueado}>Desmarcar todo</button>
        </div>
      </div>
      ${estado.bloqueo ? `<div class="aviso aviso--alerta aviso--pequeno arbol-permisos__bloqueo">${estado.bloqueo}</div>` : ''}
      <div class="arbol-permisos__herramientas">
        <span class="arbol-permisos__total" id="total-permisos">${totalMarcados()}</span>
        <button type="button" class="arbol-permisos__enlace" data-ramas="abrir">Expandir todo</button>
        <button type="button" class="arbol-permisos__enlace" data-ramas="cerrar">Contraer todo</button>
        ${leyenda}
      </div>
      <div class="arbol-permisos__buscar">
        <label class="arbol-permisos__etiqueta" for="buscar-permiso">Buscar permiso</label>
        <input type="search" id="buscar-permiso" placeholder="Nombre, código o módulo…" value="${esc(estado.filtro)}" autocomplete="off">
      </div>
      <div class="arbol-permisos__lista" id="arbol" role="tree" aria-label="Permisos">${arbol()}</div>
    </section>
    <aside class="resumen-permisos" id="resumen-permisos">${resumen()}</aside>
  </div>`;
}

// Estructura de toda la sección (el contenido de cada parte lo pinta el controlador)
export const pantalla = () => `<div id="permisos-app">
    ${pestanas()}
    <section class="contexto-permisos" id="contexto-permisos"></section>
    <div id="zona-permisos"></div>
  </div>`;
