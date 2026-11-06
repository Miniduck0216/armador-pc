// Estado local del visitante: el PC que está armando y la bandeja de comparación.
// Se guarda en el navegador (no requiere cuenta). Guardar un armado en la cuenta usa la API.
import { aviso, guardarLocal, leerLocal } from './util.js';

const CLAVE_PC = 'armadorpc.miPc';
const CLAVE_COMPARAR = 'armadorpc.comparar';
export const MAX_COMPARAR = 3;

// ---- Mi PC: { CPU: 90, GPU: 31, ... } (una pieza por categoría) ----
export const leerPc = () => leerLocal(CLAVE_PC, {});
export const guardarPc = (pc) => {
  guardarLocal(CLAVE_PC, pc);
  window.dispatchEvent(new CustomEvent('mipc'));
};
export function ponerEnPc(categoria, id) {
  const pc = leerPc();
  pc[categoria] = Number(id);
  guardarPc(pc);
}
export function quitarDePc(categoria) {
  const pc = leerPc();
  delete pc[categoria];
  guardarPc(pc);
}
export const idsPc = (pc = leerPc()) => Object.values(pc).map(Number).filter(Boolean);

// ---- Comparación: hasta 3 piezas de la misma categoría ----
export const leerComparar = () => leerLocal(CLAVE_COMPARAR, { categoria: null, items: [] });
function guardarComparar(c) {
  guardarLocal(CLAVE_COMPARAR, c);
  window.dispatchEvent(new CustomEvent('comparar'));
}
export function alternarComparar(p) {
  const c = leerComparar();
  const codigo = p.categoria?.codigo ?? p.categoria;
  if (c.items.some((x) => x.id === p.id)) {
    c.items = c.items.filter((x) => x.id !== p.id);
    if (!c.items.length) c.categoria = null;
    guardarComparar(c);
    return false;
  }
  if (c.categoria && c.categoria !== codigo) {
    // Cambiar de categoría vacía la bandeja (solo se comparan piezas del mismo tipo)
    c.items = [];
  }
  if (c.items.length >= MAX_COMPARAR) {
    aviso(`Puedes comparar hasta ${MAX_COMPARAR} piezas a la vez`, 'error');
    return false;
  }
  c.categoria = codigo;
  c.items.push({ id: p.id, nombre: p.nombreCompleto ?? p.nombre, imagen: p.imagen ?? null });
  guardarComparar(c);
  return true;
}
export const enComparar = (id) => leerComparar().items.some((x) => x.id === id);
export const vaciarComparar = () => guardarComparar({ categoria: null, items: [] });
