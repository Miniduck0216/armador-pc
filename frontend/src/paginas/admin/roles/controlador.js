// CONTROLADOR de Roles y permisos: escucha lo que hace la persona (clics, casillas,
// búsquedas), cambia el MODELO y le pide a la VISTA que vuelva a pintar.
import { enviar } from '../../../js/api.js';
import { aviso, confirmar, esc, retrasar } from '../../../js/util.js';
import { campo, casilla, formularioModal } from '../comun.js';
import * as modelo from './modelo.js';
import * as vista from './vista.js';

const { estado } = modelo;
let raiz = null; // contenedor de la sección
let recargarSeccion = null;
const $ = (selector) => raiz.querySelector(selector);

// ---------- Pintar ----------
function pintarContexto() {
  $('#contexto-permisos').innerHTML = estado.modo === 'rol' ? vista.contextoRol() : vista.contextoUsuario();
}

function pintarZona() {
  $('#zona-permisos').innerHTML = vista.zona();
  ajustarIndeterminadas();
}

// Solo el árbol y el resumen: así el buscador de permisos no pierde el foco
function pintarArbol() {
  if (!$('#arbol')) return;
  $('#arbol').innerHTML = vista.arbol();
  $('#total-permisos').textContent = vista.totalMarcados();
  $('#resumen-permisos').innerHTML = vista.resumen();
  ajustarIndeterminadas();
}

// La casilla "a medias" no existe en HTML: se activa con la propiedad indeterminate
function ajustarIndeterminadas() {
  raiz.querySelectorAll('[data-indeterminada]').forEach((c) => (c.indeterminate = c.dataset.indeterminada === 'true'));
}

// ---------- Antes de cambiar de rol, persona o sección ----------
export async function puedeSalir() {
  const { total } = modelo.cambios();
  if (!total || !raiz?.isConnected) return true;
  return confirmar({ titulo: '¿Descartar los cambios?', mensaje: `Tienes ${total} cambio(s) sin guardar en los permisos.`, boton: 'Descartar' });
}

export const hayCambios = () => !!raiz?.isConnected && modelo.cambios().total > 0;

// ---------- Acciones ----------
async function cambiarPestana(modo) {
  if (modo === estado.modo || !(await puedeSalir())) return;
  estado.modo = modo;
  estado.filtro = '';
  if (modo === 'rol') modelo.usarRol();
  else if (estado.usuario) await modelo.usarUsuario(estado.usuario.id);
  else modelo.vaciar();
  raiz.querySelector('.pestanas').outerHTML = vista.pestanas();
  pintarContexto();
  pintarZona();
}

async function elegirUsuario(id) {
  cerrarLista();
  if (!(await puedeSalir())) return;
  await modelo.usarUsuario(id);
  pintarContexto();
  pintarZona();
}

async function guardar() {
  if (!modelo.cambios().total || estado.bloqueo) return;
  estado.guardando = true;
  $('#resumen-permisos').innerHTML = vista.resumen();
  try {
    aviso(await modelo.guardar());
  } catch (er) {
    aviso(er.message, 'error');
  } finally {
    estado.guardando = false;
    pintarArbol();
  }
}

async function eliminarRol() {
  const r = modelo.rolActual();
  const mensaje = r.usuarios ? `Hoy lo tienen ${r.usuarios} usuario(s): primero cámbiales el rol.` : 'Se borrará el rol y sus permisos.';
  if (!(await confirmar({ titulo: `¿Eliminar el rol ${r.nombre}?`, mensaje, boton: 'Eliminar' }))) return;
  try {
    await modelo.eliminarRol();
    aviso('Rol eliminado');
    recargarSeccion();
  } catch (er) {
    aviso(er.message, 'error');
  }
}

// Crear un rol: el código y el nombre se validan otra vez en el servidor
function nuevoRol() {
  formularioModal({
    titulo: 'Nuevo rol',
    ancho: 560,
    boton: 'Crear rol',
    html: `
      <div class="formulario__dos">
        ${campo('Código', '<input name="codigo" required pattern="[a-z][a-z_]{2,29}" placeholder="vendedor">')}
        ${campo('Nombre', '<input name="nombre" required minlength="3" maxlength="40" placeholder="Vendedor">')}
      </div>
      ${campo('Descripción', '<input name="descripcion" maxlength="160">')}
      <div class="formulario__campo"><span class="formulario__etiqueta">Permisos</span>
        <div class="pila">${estado.catalogo.map((p) => casilla(esc(p.nombre), `name="permisos" value="${esc(p.codigo)}"`)).join('')}</div></div>`,
    alEnviar: async (f) => {
      const nuevo = await enviar('/admin/roles', {
        codigo: f.codigo.value.trim(),
        nombre: f.nombre.value.trim(),
        descripcion: f.descripcion.value.trim(),
        permisos: [...f.querySelectorAll('[name=permisos]:checked')].map((c) => c.value),
      });
      aviso('Rol creado');
      estado.rolId = nuevo.id;
      recargarSeccion();
    },
  });
}

// ---------- Buscador de personas ----------
async function mostrarUsuarios(texto) {
  $('#lista-usuarios').innerHTML = vista.resultadosUsuarios(await modelo.buscarUsuarios(texto));
  $('#lista-usuarios').hidden = false;
  $('#buscar-usuario').setAttribute('aria-expanded', 'true');
}

function cerrarLista() {
  const lista = raiz?.querySelector('#lista-usuarios');
  if (!lista) return;
  lista.hidden = true;
  $('#buscar-usuario').setAttribute('aria-expanded', 'false');
}

// ---------- Eventos ----------
async function alHacerClic(e) {
  const t = e.target;
  const pestana = t.closest('[data-pestana]');
  if (pestana) return cambiarPestana(pestana.dataset.pestana);

  const persona = t.closest('[data-elegir-usuario]');
  if (persona) return elegirUsuario(Number(persona.dataset.elegirUsuario));
  if (!t.closest('.buscador-usuario')) cerrarLista();

  // Flecha o nombre del módulo: abre o cierra la rama (la casilla no)
  const rama = t.closest('[data-alternar-rama]');
  if (rama && !t.matches('input')) {
    modelo.alternarModulo(rama.dataset.alternarRama);
    return pintarArbol();
  }
  const ramas = t.closest('[data-ramas]');
  if (ramas) {
    estado.abiertas = ramas.dataset.ramas === 'abrir' ? new Set(modelo.modulos()) : new Set();
    return pintarArbol();
  }
  const todo = t.closest('[data-todo]');
  if (todo) {
    modelo.marcar(estado.catalogo.map((p) => p.codigo), todo.dataset.todo === 'si');
    return pintarArbol();
  }
  if (t.closest('[data-descartar]')) {
    modelo.descartar();
    return pintarArbol();
  }
  if (t.closest('[data-guardar]')) return guardar();
  if (t.closest('[data-rol-nuevo]')) return nuevoRol();
  if (t.closest('[data-rol-borrar]')) return eliminarRol();
}

async function alCambiar(e) {
  const t = e.target;
  if (t.id === 'elegir-rol') {
    if (!(await puedeSalir())) {
      t.value = estado.rolId; // se queda en el rol anterior
      return;
    }
    modelo.usarRol(Number(t.value));
    pintarContexto();
    return pintarZona();
  }
  if (t.dataset.marcarRama) modelo.marcar(modelo.permisosDe(t.dataset.marcarRama).map((p) => p.codigo), t.checked);
  else if (t.dataset.marcarPermiso) modelo.marcar([t.dataset.marcarPermiso], t.checked);
  else return;
  pintarArbol();
}

const buscarConPausa = retrasar((texto) => mostrarUsuarios(texto).catch((er) => aviso(er.message, 'error')), 220);

function alEscribir(e) {
  if (e.target.id === 'buscar-permiso') {
    estado.filtro = e.target.value;
    pintarArbol();
  } else if (e.target.id === 'buscar-usuario') {
    buscarConPausa(e.target.value.trim());
  }
}

// ---------- Sección del panel ----------
export default {
  titulo: 'Roles y permisos',
  icono: 'escudo',
  permiso: 'roles.gestionar',

  async html({ usuario }) {
    estado.yo = usuario;
    await modelo.cargarRoles();
    return vista.pantalla();
  },

  conectar(zona, { recargar }) {
    raiz = zona;
    recargarSeccion = recargar;
    if (estado.modo === 'rol') modelo.usarRol();
    pintarContexto();
    pintarZona();
    const conError = (fn) => (e) => fn(e).catch((er) => aviso(er.message, 'error'));
    zona.addEventListener('click', conError(alHacerClic));
    zona.addEventListener('change', conError(alCambiar));
    zona.addEventListener('input', alEscribir);
    // Al enfocar el buscador se muestran las primeras personas sin tener que escribir
    zona.addEventListener('focusin', (e) => e.target.id === 'buscar-usuario' && mostrarUsuarios(e.target.value.trim()).catch(() => {}));
    zona.addEventListener('keydown', (e) => e.key === 'Escape' && cerrarLista());
  },

  puedeSalir,
};
