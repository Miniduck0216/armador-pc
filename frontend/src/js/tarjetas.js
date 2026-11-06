// Tarjetas reutilizables (productos, categorías, configuraciones y guías)
import { icono } from './iconos.js';
import { dinero, esc, imagen, insigniaGama, variacion, estrellas } from './util.js';
import { alternarComparar, enComparar, ponerEnPc, leerPc } from './estado.js';
import { aviso } from './util.js';

export function tarjetaProducto(p, { acciones = true } = {}) {
  const precio = p.tieneOfertas
    ? `<div class="precio">${dinero(p.precio)} ${variacion(p.variacion)}</div>
       <div class="tienda-linea">${p.hayStock ? '' : '<span class="insignia roja">Sin stock</span> '}en <b style="color:${esc(p.tienda?.color ?? 'inherit')}">${esc(p.tienda?.nombre ?? '—')}</b>${p.ofertas > 1 ? ` · ${p.ofertas} tiendas` : ''}</div>`
    : `<div class="precio referencia">${dinero(p.precioReferencia)}</div>
       <div class="tienda-linea">Sin ofertas en Ecuador · precio de referencia</div>`;
  return `
    <article class="tarjeta-producto" data-id="${p.id}">
      <a class="foto" href="/producto.html?id=${p.id}">
        ${imagen(p.imagen, p.nombreCompleto)}
        <span class="sobre-foto">${insigniaGama(p.gama)}</span>
        ${p.imagenEsReferencia ? '<span class="foto-referencia">Foto de referencia</span>' : ''}
      </a>
      <div class="cuerpo">
        <span class="categoria">${esc(p.categoria?.nombre ?? '')} · ${esc(p.marca)}</span>
        <h3><a href="/producto.html?id=${p.id}">${esc(p.nombre)}</a></h3>
        ${p.destacados?.length ? `<div class="chips">${p.destacados.slice(0, 3).map((d) => `<span>${esc(d)}</span>`).join('')}</div>` : ''}
        ${p.calificacion ? `<div class="pequeno">${estrellas(p.calificacion.promedio)} <span class="tenue">(${p.calificacion.total})</span></div>` : ''}
        <div class="pie-tarjeta">
          <div>${precio}</div>
          ${
            acciones
              ? `<div class="acciones">
                  <button class="icono-boton ${enComparar(p.id) ? 'activo' : ''}" data-comparar title="Comparar">${icono('comparar')}</button>
                  ${p.categoria?.codigo ? `<button class="icono-boton amarillo" data-agregar="${p.categoria.codigo}" title="Añadir a mi PC">${icono('mas')}</button>` : ''}
                </div>`
              : ''
          }
        </div>
      </div>
    </article>`;
}

// Conecta los botones de comparar / añadir de una lista de tarjetas
// (se puede llamar varias veces sobre el mismo contenedor: solo se registra un manejador)
export function activarTarjetas(contenedor, productos) {
  contenedor._productos = new Map(productos.map((p) => [p.id, p]));
  if (contenedor._tarjetasActivas) return;
  contenedor._tarjetasActivas = true;
  contenedor.addEventListener('click', (e) => {
    const porId = contenedor._productos;
    const tarjeta = e.target.closest('.tarjeta-producto');
    if (!tarjeta) return;
    const p = porId.get(Number(tarjeta.dataset.id));
    if (!p) return;
    if (e.target.closest('[data-comparar]')) {
      const activo = alternarComparar(p);
      contenedor.querySelectorAll('.tarjeta-producto [data-comparar]').forEach((b) => b.classList.toggle('activo', enComparar(Number(b.closest('.tarjeta-producto').dataset.id))));
      if (activo) aviso(`${p.nombre} añadido a la comparación`);
    }
    const agregar = e.target.closest('[data-agregar]');
    if (agregar) {
      const antes = leerPc()[agregar.dataset.agregar];
      ponerEnPc(agregar.dataset.agregar, p.id);
      aviso(antes ? `${p.nombre} reemplaza tu ${p.categoria.nombre.toLowerCase()}` : `${p.nombre} añadido a tu PC`);
    }
  });
}

export function mosaicoCategoria(c, href = `/componentes.html?categoria=${c.codigo}`) {
  return `
    <a class="mosaico" href="${href}">
      ${imagen(c.imagenUrl, c.plural)}
      <span class="velo"></span>
      <span class="texto"><b>${esc(c.plural)}</b><small>${c.referencias ?? ''} modelos${c.precioDesde ? ` · desde ${dinero(c.precioDesde)}` : ''}</small></span>
    </a>`;
}

export function tarjetaConfiguracion(c) {
  return `
    <article class="tarjeta-config ${c.recomendada ? 'recomendada' : ''}">
      <div class="foto">
        ${imagen(c.imagenUrl, c.titulo)}
        <span class="insignia oscura">${esc(c.etiqueta)}</span>
        ${c.recomendada ? '<span class="insignia amarilla recomendada-insignia">Recomendada</span>' : ''}
      </div>
      <div class="cuerpo">
        <span class="antetitulo">${esc(c.antetitulo)}</span>
        <h3>${esc(c.titulo)}</h3>
        <p class="tenue">${esc(c.descripcion)}</p>
        <div class="chips">${(c.chips ?? []).map((x) => `<span>${esc(x)}</span>`).join('')}</div>
        <ul class="destacadas">${(c.destacadas ?? []).map((d) => `<li><b>${esc(d.categoria)}</b>${esc(d.nombre)}</li>`).join('')}</ul>
        <div class="precio-config">
          <div><small>Precio actual</small><strong>${dinero(c.total)}</strong></div>
          <div class="rendimiento-mini"><small>Rendimiento</small><span class="barra-mini"><i style="width:${c.rendimiento?.puntaje ?? 0}%"></i></span><b>${esc(c.rendimiento?.nivel ?? '')}</b></div>
        </div>
        <div class="acciones-config">
          <button class="boton secundario pequeno" data-ver="${esc(c.slug)}">Ver componentes</button>
          <a class="boton pequeno" href="/configurador.html?piezas=${(c.piezas ?? []).join(',')}">Personalizar ${icono('flecha', 15)}</a>
        </div>
      </div>
    </article>`;
}

export function tarjetaGuia(g) {
  return `
    <a class="tarjeta-guia" href="/guia.html?slug=${esc(g.slug)}">
      <div class="foto">${imagen(g.imagenUrl, g.titulo)}</div>
      <div class="cuerpo">
        <div class="chips">${String(g.etiquetas ?? '')
          .split(',')
          .filter(Boolean)
          .map((e) => `<span>${esc(e.trim())}</span>`)
          .join('')}</div>
        <h3>${esc(g.titulo)}</h3>
        <p class="tenue">${esc(g.resumen)}</p>
        <span class="pequeno tenue">${icono('reloj', 14)} ${g.minutosLectura} min de lectura</span>
      </div>
    </a>`;
}
