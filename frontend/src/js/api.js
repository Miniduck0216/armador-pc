// Cliente de la API REST (backend NestJS). Todas las rutas empiezan con /api.
// En desarrollo Vite las reenvía al puerto 3000; en producción las sirve el mismo backend.

export class ErrorApi extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.estado = estado;
  }
}

function textoError(datos, estado) {
  const m = datos?.mensaje ?? datos?.message;
  if (Array.isArray(m)) return m.join('. ');
  if (m) return m;
  if (estado === 0) return 'No hay conexión con el servidor. ¿Está corriendo el backend?';
  return `Error ${estado}`;
}

export async function api(ruta, { metodo = 'GET', cuerpo } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: metodo,
      credentials: 'same-origin',
      headers: cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi(textoError(null, 0), 0);
  }
  if (respuesta.status === 204) return null;
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw new ErrorApi(textoError(datos, respuesta.status), respuesta.status);
  return datos;
}

export const obtener = (ruta) => api(ruta);
export const enviar = (ruta, cuerpo = {}) => api(ruta, { metodo: 'POST', cuerpo });
export const actualizar = (ruta, cuerpo = {}, metodo = 'PATCH') => api(ruta, { metodo, cuerpo });
export const borrar = (ruta) => api(ruta, { metodo: 'DELETE' });

// Lleva al inicio de sesión y vuelve a esta página después
export function irAIngresar() {
  const volver = encodeURIComponent(location.pathname + location.search);
  location.href = `/ingresar.html?volver=${volver}`;
}

// Ejecuta una acción que requiere sesión: si la API responde 401, manda a ingresar
export async function conSesion(accion) {
  try {
    return await accion();
  } catch (e) {
    if (e.estado === 401) irAIngresar();
    throw e;
  }
}

// Construye "?a=1&b=2" ignorando valores vacíos
export function consulta(parametros) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(parametros)) if (v !== undefined && v !== null && v !== '' && v !== false) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : '';
}
