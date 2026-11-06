// Utilidades de presentación compartidas por todas las páginas

const FORMATO_DOLAR = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const dinero = (n) => (n === null || n === undefined || Number.isNaN(Number(n)) ? '—' : FORMATO_DOLAR.format(Number(n)));
export const dineroCorto = (n) => (n === null || n === undefined ? '—' : `$${Math.round(Number(n)).toLocaleString('en-US')}`);

export function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export const $ = (sel, raiz = document) => raiz.querySelector(sel);
export const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
export const param = (nombre) => new URLSearchParams(location.search).get(nombre);

export function fecha(valor, conHora = false) {
  if (!valor) return '—';
  const d = new Date(valor);
  return d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric', ...(conHora ? { hour: '2-digit', minute: '2-digit' } : {}) });
}

export function hace(valor) {
  if (!valor) return 'nunca';
  const s = (Date.now() - new Date(valor).getTime()) / 1000;
  if (s < 60) return 'hace un momento';
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
  return `hace ${Math.round(s / 86400)} días`;
}

// Mensaje flotante breve (éxito o error)
export function aviso(texto, tipo = 'exito') {
  const el = document.createElement('div');
  el.className = `aviso-flotante ${tipo}`;
  el.setAttribute('role', 'status');
  el.textContent = texto;
  document.body.append(el);
  setTimeout(() => el.classList.add('saliendo'), 2800);
  setTimeout(() => el.remove(), 3200);
}

// Imagen con respaldo: si la foto no carga, se muestra un dibujo genérico
export function imagen(url, alt = '', clase = '') {
  const src = url || '/sin-imagen.svg';
  return `<img class="${clase}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='/sin-imagen.svg'">`;
}

// localStorage puede fallar (modo privado, almacenamiento bloqueado): nunca rompe la página
export function leerLocal(clave, porDefecto) {
  try {
    const v = localStorage.getItem(clave);
    return v === null ? porDefecto : JSON.parse(v);
  } catch {
    return porDefecto;
  }
}
export function guardarLocal(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* sin almacenamiento: se ignora */
  }
}

export function insigniaGama(gama) {
  if (!gama) return '';
  const clase = { Básica: 'gris', Media: '', Alta: 'verde', Entusiasta: 'amarilla' }[gama] ?? '';
  return `<span class="insignia ${clase}">${esc(gama)}</span>`;
}

export function variacion(v) {
  if (v === null || v === undefined || Math.abs(v) < 0.5) return '';
  return `<span class="variacion ${v < 0 ? 'baja' : 'sube'}">${v < 0 ? '▼' : '▲'} ${Math.abs(v).toFixed(1)}%</span>`;
}

export function estrellas(promedio) {
  const llenas = Math.round(Number(promedio) || 0);
  return `<span class="estrellas" aria-label="${promedio} de 5">${'★'.repeat(llenas)}<span class="vacias">${'★'.repeat(5 - llenas)}</span></span>`;
}

export function cargando(el, filas = 3, alto = 120) {
  el.innerHTML = Array.from({ length: filas }, () => `<div class="esqueleto" style="height:${alto}px"></div>`).join('');
}

export function errorEn(el, e) {
  el.innerHTML = `<div class="aviso error">${esc(e?.message ?? e)}</div>`;
}

// Debounce para buscadores
export function retrasar(fn, ms = 250) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}

// Abre un panel modal; devuelve funciones para cerrarlo y su cuerpo
export function modal({ titulo, contenido = '', ancho = 760 }) {
  const fondo = document.createElement('div');
  fondo.className = 'modal-fondo';
  fondo.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(titulo)}" style="max-width:${ancho}px">
      <div class="modal-cabecera"><h3>${esc(titulo)}</h3><button class="icono-boton" data-cerrar aria-label="Cerrar">✕</button></div>
      <div class="modal-cuerpo">${contenido}</div>
    </div>`;
  const cerrar = () => {
    fondo.remove();
    document.removeEventListener('keydown', alTeclear);
    document.body.style.overflow = '';
  };
  const alTeclear = (e) => e.key === 'Escape' && cerrar();
  fondo.addEventListener('click', (e) => {
    if (e.target === fondo || e.target.closest('[data-cerrar]')) cerrar();
  });
  document.addEventListener('keydown', alTeclear);
  document.body.append(fondo);
  document.body.style.overflow = 'hidden';
  return { cerrar, cuerpo: fondo.querySelector('.modal-cuerpo'), raiz: fondo };
}

export function copiar(texto) {
  return navigator.clipboard?.writeText(texto).then(
    () => aviso('Enlace copiado'),
    () => prompt('Copia este enlace:', texto),
  );
}
