// MODELO de Roles y permisos: los datos de la pantalla y las reglas para cambiarlos.
// No toca el HTML: eso lo hace la vista. Tampoco escucha clics: eso lo hace el controlador.
import { actualizar, api, borrar } from '../../../js/api.js';
import { esc } from '../../../js/util.js';

export const estado = {
  modo: 'rol', // pestaña abierta: 'rol' o 'usuario'
  catalogo: [], // todos los permisos: [{ codigo, nombre, modulo }]
  roles: [],
  rolId: null, // rol elegido
  usuario: null, // persona elegida: { id, nombre, correo, rol, esAdmin }
  delRol: new Set(), // permisos que la persona recibe por su rol
  guardados: new Set(), // lo que está en la base de datos
  marcados: new Set(), // lo que se ve marcado en pantalla (aún sin guardar)
  bloqueo: '', // motivo por el que no se puede editar (vacío = se puede)
  abiertas: new Set(), // módulos desplegados en el árbol
  filtro: '', // texto del buscador de permisos
  guardando: false,
  yo: null, // quien usa el panel
};

// ---------- Consultas ----------
export const modulos = () => [...new Set(estado.catalogo.map((p) => p.modulo))];
export const permisosDe = (modulo) => estado.catalogo.filter((p) => p.modulo === modulo);
export const nombreDe = (codigo) => estado.catalogo.find((p) => p.codigo === codigo)?.nombre ?? codigo;
export const rolActual = () => estado.roles.find((r) => r.id === estado.rolId);

// Diferencia entre lo marcado y lo guardado
export function cambios() {
  const agregados = [...estado.marcados].filter((c) => !estado.guardados.has(c));
  const quitados = [...estado.guardados].filter((c) => !estado.marcados.has(c));
  return { agregados, quitados, total: agregados.length + quitados.length };
}

// Un módulo está completo, parcial (algunos marcados) o vacío
export function nivelDe(modulo) {
  const todos = permisosDe(modulo);
  const marcados = todos.filter((p) => estado.marcados.has(p.codigo)).length;
  const nivel = marcados === todos.length ? 'completo' : marcados ? 'parcial' : 'vacio';
  return { nivel, marcados, total: todos.length };
}

// Busca sin importar tildes ni mayúsculas
const normalizar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export function permisosVisibles(modulo) {
  const texto = normalizar(estado.filtro);
  return permisosDe(modulo).filter((p) => !texto || normalizar(`${p.nombre} ${p.codigo} ${modulo}`).includes(texto));
}

// ---------- Cambios en pantalla (todavía sin guardar) ----------
export function marcar(codigos, si) {
  codigos.forEach((c) => (si ? estado.marcados.add(c) : estado.marcados.delete(c)));
}

// Sin nadie elegido (pestaña "Por usuario" recién abierta) no hay nada marcado
export function vaciar() {
  estado.marcados = new Set();
  estado.guardados = new Set();
}

export function descartar() {
  estado.marcados = new Set(estado.guardados);
}

export function alternarModulo(modulo) {
  if (estado.abiertas.has(modulo)) estado.abiertas.delete(modulo);
  else estado.abiertas.add(modulo);
}

// ---------- Datos del servidor ----------
export async function cargarRoles() {
  const d = await api('/admin/roles');
  estado.catalogo = d.permisos;
  estado.roles = d.roles;
  // Si el rol elegido ya no existe, se elige el primero que se pueda editar
  if (!rolActual()) estado.rolId = (estado.roles.find((r) => !r.bloqueado) ?? estado.roles[0])?.id ?? null;
  if (!estado.abiertas.size) modulos().forEach((m) => estado.abiertas.add(m));
}

// Pone en pantalla los permisos del rol elegido
export function usarRol(id = estado.rolId) {
  estado.rolId = id;
  const r = rolActual();
  estado.guardados = new Set(r?.permisos ?? []);
  estado.marcados = new Set(estado.guardados);
  estado.bloqueo = r?.bloqueado ? 'El rol <b>Administrador</b> tiene acceso total: siempre conserva todos los permisos y no se puede editar.' : '';
}

// Pone en pantalla los permisos efectivos de una persona (su rol + ajustes propios)
export async function usarUsuario(id) {
  const d = await api(`/admin/permisos-usuarios/${id}`);
  estado.usuario = d.usuario;
  estado.delRol = new Set(d.permisos.filter((p) => p.delRol).map((p) => p.codigo));
  estado.guardados = new Set(d.permisos.filter((p) => p.efectivo).map((p) => p.codigo));
  estado.marcados = new Set(estado.guardados);
  if (d.usuario.esAdmin) estado.bloqueo = `<b>${esc(d.usuario.nombre)}</b> es Administrador: tiene acceso total a todos los módulos. No hace falta marcar permisos.`;
  else if (d.usuario.id === estado.yo?.id) estado.bloqueo = 'No puedes cambiar tus propios permisos. Pide a otro administrador que lo haga.';
  else estado.bloqueo = '';
}

export const buscarUsuarios = (texto) => api(`/admin/permisos-usuarios?buscar=${encodeURIComponent(texto)}`);

// Envía al servidor la lista completa de permisos marcados. Devuelve el mensaje para el aviso.
export async function guardar() {
  const permisos = [...estado.marcados];
  const total = cambios().total;
  let mensaje;
  if (estado.modo === 'rol') {
    await actualizar(`/admin/roles/${estado.rolId}/permisos`, { permisos }, 'PUT');
    rolActual().permisos = permisos;
    mensaje = `Se guardaron ${total} cambio(s) del rol ${rolActual().nombre}`;
  } else {
    const r = await actualizar(`/admin/permisos-usuarios/${estado.usuario.id}`, { permisos }, 'PUT');
    mensaje = `Permisos de ${estado.usuario.nombre} guardados (${r.agregados} agregado(s) y ${r.quitados} quitado(s) frente a su rol)`;
  }
  estado.guardados = new Set(permisos);
  return mensaje;
}

export async function eliminarRol() {
  await borrar(`/admin/roles/${estado.rolId}`);
  estado.rolId = null;
}
