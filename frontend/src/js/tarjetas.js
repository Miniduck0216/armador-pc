// Tarjetas reutilizables (productos, categorías, configuraciones y guías)
import { icono } from './iconos.js';
import { dinero, esc, imagen, insigniaGama, variacion, estrellas } from './util.js';
import { alternarComparar, enComparar, ponerEnPc, leerPc } from './estado.js';
import { aviso } from './util.js';

export function tarjetaProducto(p, { acciones = true } = {}) {
  // El color de la tienda viene de la base de datos, por eso va en línea
  const tienda = `<b style="color:${esc(p.tienda?.color ?? 'inherit')}">${esc(p.tienda?.nombre ?? '—')}</b>`;
  const precio = p.tieneOfertas
    ? `<div class="tarjeta-producto__precio">${dinero(p.precio)} ${variacion(p.variacion)}</div>
       <div class="tarjeta-producto__tienda">${p.hayStock ? '' : '<span class="insignia insignia--roja">Sin stock</span> '}en ${tienda}${p.ofertas > 1 ? ` · ${p.ofertas} tiendas` : ''}</div>`
    : `<div class="tarjeta-producto__precio tarjeta-producto__precio--referencia">${dinero(p.precioReferencia)}</div>
       <div class="tarjeta-producto__tienda">Sin ofertas en Ecuador · precio de referencia</div>`;
  const botones = acciones
    ? `<div class="tarjeta-producto__acciones">
        <button class="icono-boton ${enComparar(p.id) ? 'icono-boton--activo' : ''}" data-comparar title="Comparar">${icono('comparar')}</button>
        ${p.categoria?.codigo ? `<button class="icono-boton icono-boton--amarillo" data-agregar="${p.categoria.codigo}" title="Añadir a mi PC">${icono('mas')}</button>` : ''}
      </div>`
    : '';
  return `
    <article class="tarjeta-producto" data-id="${p.id}">
      <a class="tarjeta-producto__foto" href="/producto.html?id=${p.id}">
        ${imagen(p.imagen, p.nombreCompleto, 'tarjeta-producto__imagen')}
        <span class="tarjeta-producto__insignias">${insigniaGama(p.gama)}</span>
        ${p.imagenEsReferencia ? '<span class="tarjeta-producto__referencia">Foto de referencia</span>' : ''}
      </a>
      <div class="tarjeta-producto__cuerpo">
        <span class="tarjeta-producto__categoria">${esc(p.categoria?.nombre ?? '')} · ${esc(p.marca)}</span>
        <h3 class="tarjeta-producto__nombre"><a class="tarjeta-producto__enlace" href="/producto.html?id=${p.id}">${esc(p.nombre)}</a></h3>
        ${p.destacados?.length ? chips(p.destacados.slice(0, 3)) : ''}
        ${p.calificacion ? `<div class="texto texto--pequeno">${estrellas(p.calificacion.promedio)} <span class="texto texto--tenue">(${p.calificacion.total})</span></div>` : ''}
        <div class="tarjeta-producto__pie">
          <div>${precio}</div>
          ${botones}
        </div>
      </div>
    </article>`;
}

// Lista de etiquetas pequeñas
export const chips = (lista) => `<div class="chips">${lista.map((x) => `<span class="chips__chip">${esc(x)}</span>`).join('')}</div>`;

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
      contenedor
        .querySelectorAll('.tarjeta-producto [data-comparar]')
        .forEach((b) => b.classList.toggle('icono-boton--activo', enComparar(Number(b.closest('.tarjeta-producto').dataset.id))));
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

// Mosaico de una categoría. "modificador" agrega clases (por ejemplo 'mosaico--activo')
// y "atributos" agrega atributos extra (por ejemplo data-cat="CPU").
export function mosaicoCategoria(c, { href = `/componentes.html?categoria=${c.codigo}`, modificador = '', atributos = '' } = {}) {
  return `
    <a class="mosaico ${modificador}" href="${href}" ${atributos}>
      ${imagen(c.imagenUrl, c.plural, 'mosaico__imagen')}
      <span class="mosaico__velo"></span>
      <span class="mosaico__texto"><b class="mosaico__titulo">${esc(c.plural)}</b><small class="mosaico__detalle">${c.referencias ?? ''} modelos${c.precioDesde ? ` · desde ${dinero(c.precioDesde)}` : ''}</small></span>
    </a>`;
}

export function tarjetaConfiguracion(c) {
  const destacadas = (c.destacadas ?? [])
    .map((d) => `<li class="tarjeta-config__pieza"><b class="tarjeta-config__categoria">${esc(d.categoria)}</b>${esc(d.nombre)}</li>`)
    .join('');
  return `
    <article class="tarjeta-config ${c.recomendada ? 'tarjeta-config--recomendada' : ''}">
      <div class="tarjeta-config__foto">
        ${imagen(c.imagenUrl, c.titulo, 'tarjeta-config__imagen')}
        <span class="insignia insignia--oscura tarjeta-config__etiqueta">${esc(c.etiqueta)}</span>
        ${c.recomendada ? '<span class="insignia insignia--amarilla tarjeta-config__recomendada">Recomendada</span>' : ''}
      </div>
      <div class="tarjeta-config__cuerpo">
        <span class="seccion__antetitulo">${esc(c.antetitulo)}</span>
        <h3 class="tarjeta-config__titulo">${esc(c.titulo)}</h3>
        <p class="texto texto--tenue">${esc(c.descripcion)}</p>
        ${chips(c.chips ?? [])}
        <ul class="tarjeta-config__piezas">${destacadas}</ul>
        <div class="tarjeta-config__precio">
          <div><small class="tarjeta-config__nota">Precio actual</small><strong class="tarjeta-config__total">${dinero(c.total)}</strong></div>
          <div class="tarjeta-config__rendimiento">
            <small class="tarjeta-config__nota">Rendimiento</small>
            <span class="tarjeta-config__barra"><i class="tarjeta-config__relleno" style="width:${c.rendimiento?.puntaje ?? 0}%"></i></span>
            <b>${esc(c.rendimiento?.nivel ?? '')}</b>
          </div>
        </div>
        <div class="tarjeta-config__acciones">
          <button class="boton boton--secundario boton--pequeno" data-ver="${esc(c.slug)}">Ver componentes</button>
          <a class="boton boton--pequeno" href="/configurador.html?piezas=${(c.piezas ?? []).join(',')}">Personalizar ${icono('flecha', 15)}</a>
        </div>
      </div>
    </article>`;
}

export function tarjetaGuia(g) {
  const etiquetas = String(g.etiquetas ?? '').split(',').filter(Boolean).map((e) => e.trim());
  return `
    <a class="tarjeta-guia" href="/guia.html?slug=${esc(g.slug)}">
      <div class="tarjeta-guia__foto">${imagen(g.imagenUrl, g.titulo, 'tarjeta-guia__imagen')}</div>
      <div class="tarjeta-guia__cuerpo">
        ${chips(etiquetas)}
        <h3 class="tarjeta-guia__titulo">${esc(g.titulo)}</h3>
        <p class="texto texto--tenue">${esc(g.resumen)}</p>
        <span class="texto texto--pequeno texto--tenue">${icono('reloj', 14)} ${g.minutosLectura} min de lectura</span>
      </div>
    </a>`;
}

// Fila de una pieza: foto, categoría, nombre, detalle y precio (listas de piezas y calculadoras)
export function filaPieza({ id, foto, nombre, etiqueta = '', detalle = '', precio }) {
  return `<a class="pieza-fila" href="/producto.html?id=${id}">
      ${imagen(foto, nombre, 'pieza-fila__foto')}
      <span class="pieza-fila__texto"><small class="pieza-fila__categoria">${esc(etiqueta)}</small><b>${esc(nombre)}</b>
        ${detalle ? `<em class="pieza-fila__detalle">${detalle}</em>` : ''}</span>
      <strong class="pieza-fila__precio">${dinero(precio)}</strong>
    </a>`;
}

// Lista de piezas de un armado o de una configuración
export function listaPiezas(piezas) {
  return `<div class="pila pila--chica">${piezas
    .map((p) => {
      const tienda = p.tienda && p.tieneOfertas !== false
        ? `en <i class="pieza-fila__tienda" style="color:${esc(p.tienda.color)}">${esc(p.tienda.nombre)}</i>${p.enStock ? '' : ' · sin stock'}`
        : 'Precio de referencia';
      return filaPieza({ id: p.id, foto: p.imagen, nombre: p.nombre, etiqueta: p.categoriaNombre, detalle: tienda, precio: p.precio });
    })
    .join('')}</div>`;
}
