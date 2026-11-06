// Gráfico de líneas en SVG para el historial de precios (sin librerías)
import { dinero, esc, fecha } from './util.js';

/**
 * @param {HTMLElement} el contenedor
 * @param {{fechas:string[], mejor:number[], porTienda:{tienda:string,color:string,precios:(number|null)[]}[]}} datos
 */
export function graficoHistorial(el, datos) {
  const W = 760, H = 280, M = { a: 14, d: 16, ab: 30, iz: 58 };
  const n = datos.fechas.length;
  if (n < 2) {
    el.innerHTML = '<div class="vacio">Todavía no hay suficiente historial.</div>';
    return;
  }
  const valores = [...datos.mejor, ...datos.porTienda.flatMap((t) => t.precios)].filter((v) => v !== null && v !== undefined);
  let min = Math.min(...valores), max = Math.max(...valores);
  const holgura = (max - min) * 0.1 || max * 0.05 || 1;
  min = Math.max(0, min - holgura);
  max += holgura;
  const x = (i) => M.iz + (i / (n - 1)) * (W - M.iz - M.d);
  const y = (v) => M.a + (1 - (v - min) / (max - min)) * (H - M.a - M.ab);
  const camino = (serie) => {
    let d = '', abierto = false;
    serie.forEach((v, i) => {
      if (v === null || v === undefined) return (abierto = false);
      d += `${abierto ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
      abierto = true;
    });
    return d;
  };

  const marcas = Array.from({ length: 5 }, (_, i) => min + ((max - min) * i) / 4);
  const pasos = Math.max(1, Math.floor(n / 6));
  const lineaMejor = camino(datos.mejor);
  const primero = datos.mejor.findIndex((v) => v !== null);
  const area = `${lineaMejor}L${x(n - 1)},${H - M.ab}L${x(primero)},${H - M.ab}Z`;

  el.innerHTML = `
    <div class="grafico">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Historial de precios">
        <defs><linearGradient id="degradado-grafico" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4bff" stop-opacity=".22"/><stop offset="1" stop-color="#6b4bff" stop-opacity="0"/></linearGradient></defs>
        ${marcas.map((m) => `<line class="eje" x1="${M.iz}" x2="${W - M.d}" y1="${y(m)}" y2="${y(m)}"/><text x="${M.iz - 8}" y="${y(m) + 4}" text-anchor="end">$${Math.round(m)}</text>`).join('')}
        ${datos.fechas.map((f, i) => (i % pasos === 0 || i === n - 1 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(fecha(f).replace(/ de \d{4}|\.? \d{4}/, ''))}</text>` : '')).join('')}
        ${datos.porTienda.map((t) => `<path class="linea" stroke="${esc(t.color)}" d="${camino(t.precios)}"/>`).join('')}
        <path class="area" d="${area}"/>
        <path class="linea mejor" d="${lineaMejor}"/>
        <line class="guia-vertical oculto" y1="${M.a}" y2="${H - M.ab}"/>
        <circle class="punto oculto" r="5" fill="#6b4bff" stroke="#fff" stroke-width="2"/>
        <rect x="${M.iz}" y="0" width="${W - M.iz - M.d}" height="${H}" fill="transparent" class="captura"/>
      </svg>
      <div class="grafico-tooltip oculto"></div>
    </div>
    <div class="leyenda"><span><i style="background:#6b4bff"></i>Mejor precio del día</span>${datos.porTienda.map((t) => `<span><i style="background:${esc(t.color)}"></i>${esc(t.tienda)}</span>`).join('')}</div>`;

  const svg = el.querySelector('svg');
  const guia = svg.querySelector('.guia-vertical');
  const punto = svg.querySelector('.punto');
  const tip = el.querySelector('.grafico-tooltip');
  const mover = (evento) => {
    const r = svg.getBoundingClientRect();
    const px = ((evento.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(n - 1, Math.round(((px - M.iz) / (W - M.iz - M.d)) * (n - 1))));
    const v = datos.mejor[i];
    if (v === null || v === undefined) return;
    guia.setAttribute('x1', x(i));
    guia.setAttribute('x2', x(i));
    punto.setAttribute('cx', x(i));
    punto.setAttribute('cy', y(v));
    [guia, punto, tip].forEach((e) => e.classList.remove('oculto'));
    tip.innerHTML = `<b>${dinero(v)}</b><br>${esc(fecha(datos.fechas[i]))}`;
    tip.style.left = `${(x(i) / W) * r.width}px`;
    tip.style.top = `${(y(v) / H) * r.height}px`;
  };
  svg.addEventListener('pointermove', mover);
  svg.addEventListener('pointerleave', () => [guia, punto, tip].forEach((e) => e.classList.add('oculto')));
}
