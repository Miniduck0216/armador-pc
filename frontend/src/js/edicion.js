// Armado que el usuario está editando en el configurador (se guarda en el navegador).
// Mientras exista, el botón "Guardar" del configurador actualiza ese armado en lugar de crear uno nuevo.
import { guardarLocal, leerLocal } from './util.js';

const CLAVE = 'armadorpc.editando';

export const armadoEnEdicion = () => leerLocal(CLAVE, null);
export const empezarEdicion = (id, nombre) => guardarLocal(CLAVE, { id, nombre });
export const terminarEdicion = () => guardarLocal(CLAVE, null);
