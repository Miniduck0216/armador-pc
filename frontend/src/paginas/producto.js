import { montar, usuario } from '../js/layout.js';
import { api, conSesion, enviar, borrar, irAIngresar } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, aviso, confirmar, dinero, errorEn, esc, estrellas, fecha, hace, imagen, insigniaGama, modal, param, tabla, variacion } from '../js/util.js';
import { activarTarjetas, chips, tarjetaProducto } from '../js/tarjetas.js';
import { alternarComparar, enComparar, leerPc, ponerEnPc } from '../js/estado.js';
import { graficoHistorial } from '../js/grafico.js';

const sesion = montar('componentes');
const id = Number(param('id'));

const FUENTES = { woocommerce: 'Tienda en línea', aliexpress: 'API de AliExpress', mercadolibre: 'API de Mercado Libre', simulada: 'Precio simulado (demo)' };

function cabecera(d) {
  const p = d.producto;
  const mejor = d.ofertas.find((o) => o.esMejor);
  const stock = p.hayStock ? '<span class="insignia insignia--verde">Con stock</span>' : p.tieneOfertas ? '<span class="insignia insignia--roja">Sin stock</span>' : '';
  const opiniones = d.calificacion.total
    ? `${estrellas(d.calificacion.promedio)} ${d.calificacion.promedio.toFixed(1)} · ${d.calificacion.total} reseña(s)`
    : 'Sé el primero en opinar';
  const precio = p.tieneOfertas
    ? `<div class="ficha__precio"><strong class="ficha__monto">${dinero(p.precio)}</strong>${variacion(p.variacion)}<span class="texto texto--tenue">mejor precio hoy</span></div>
       <div class="texto texto--tenue texto--pequeno">Rango entre tiendas: ${dinero(d.rango.min)} – ${dinero(d.rango.max)} · Referencia ${dinero(p.precioReferencia)}</div>`
    : `<div class="ficha__precio"><strong class="ficha__monto ficha__monto--referencia">${dinero(p.precioReferencia)}</strong><span class="texto texto--tenue">precio de referencia</span></div>
       <div class="aviso aviso--alerta aviso--pequeno">Ninguna tienda de Ecuador consultada lo tiene publicado ahora. Crea una alerta y te avisamos cuando aparezca o baje.</div>`;
  const envio = mejor?.envio ? ` · envío ${dinero(mejor.envio)}` : ' · envío gratis';
  const mejorOferta = mejor
    ? `<div class="ficha__mejor">
        <div><small class="texto texto--tenue">Mejor oferta</small>
          <div><b style="color:${esc(mejor.tienda.color)}">${esc(mejor.tienda.nombre)}</b> · ${mejor.enStock ? 'en stock' : 'sin stock'}${envio}</div></div>
        <a class="boton" href="${esc(mejor.url)}" target="_blank" rel="noopener nofollow">Ir a la tienda ${icono('externo', 16)}</a>
      </div>`
    : '';
  return `
    <div class="ficha__galeria">
      ${imagen(p.imagen, p.nombreCompleto, 'ficha__imagen')}
      <div class="ficha__credito">${p.imagenEsReferencia ? '<b>Foto de referencia</b> (modelo parecido). ' : ''}${esc(p.imagenCredito ?? '')}</div>
    </div>
    <div>
      <div class="fila">${insigniaGama(p.gama)}<span class="insignia insignia--gris">${esc(d.categoria.nombre)}</span>${stock}</div>
      <h1 class="ficha__titulo">${esc(p.nombreCompleto)}</h1>
      <a class="texto texto--pequeno" href="#resenas">${opiniones}</a>
      ${p.destacados?.length ? `<div class="ficha__chips">${chips(p.destacados)}</div>` : ''}
      ${precio}
      ${mejorOferta}
      <div class="fila">
        <button class="boton boton--violeta" id="agregar">${icono('mas')} ${leerPc()[d.categoria.codigo] === p.id ? 'Ya está en tu PC' : 'Añadir a mi PC'}</button>
        <button class="boton boton--secundario" id="comparar">${icono('comparar')} <span>${enComparar(p.id) ? 'En comparación' : 'Comparar'}</span></button>
        <button class="boton boton--secundario" id="favorito" title="Guardar en favoritos">${icono('corazon')}</button>
      </div>
    </div>`;
}

function tablaOfertas(ofertas) {
  if (!ofertas.length)
    return '<div class="vacio">Sin precios de tiendas por ahora. El catálogo usa el precio de referencia hasta la próxima actualización.</div>';
  const filas = ofertas.map((o) => {
    const origen = `${o.tituloTienda ? esc(o.tituloTienda) : esc(FUENTES[o.tienda.fuente] ?? '')}${o.tienda.ciudad ? ` · ${esc(o.tienda.ciudad)}` : ''}`;
    const tienda = `<div class="oferta-tienda"><span class="tienda-fila__color" style="background:${esc(o.tienda.color)}"></span>
      <div>${esc(o.tienda.nombre)}${o.esMejor ? ' <span class="insignia insignia--amarilla">Mejor</span>' : ''}<span class="oferta-tienda__origen">${origen}</span></div></div>`;
    const entrega = o.tienda.diasEntrega ? `${o.tienda.diasEntrega} día(s)` : '';
    const disponible = o.enStock
      ? `<span class="insignia insignia--verde">En stock</span> <span class="texto texto--pequeno texto--tenue">${entrega}</span>`
      : '<span class="insignia insignia--roja">Agotado</span>';
    return {
      modificador: o.esMejor ? 'destacada' : '',
      celdas: [
        tienda,
        disponible,
        [dinero(o.precio), 'derecha'],
        [o.envio ? dinero(o.envio) : '<span class="texto texto--tenue">Gratis</span>', 'derecha'],
        [`<b>${dinero(o.total)}</b>`, 'derecha'],
        [`<a class="boton boton--pequeno ${o.esMejor ? '' : 'boton--secundario'}" href="${esc(o.url)}" target="_blank" rel="noopener nofollow">Ver ${icono('externo', 14)}</a>`, 'derecha'],
      ],
    };
  });
  return `${tabla(['Tienda', 'Disponibilidad', ['Precio', 'derecha'], ['Envío', 'derecha'], ['Total', 'derecha'], ''], filas)}
    <p class="ficha__nota">Precios con IVA (15 %) incluido. Actualizado ${hace(ofertas[0].actualizado)}. Confirma el precio final en la tienda antes de comprar.</p>`;
}

// Cuatro datos con etiqueta pequeña y número grande
const datos = (lista) =>
  `<div class="datos">${lista.map(([etiqueta, valor]) => `<div class="datos__dato"><small class="datos__etiqueta">${etiqueta}</small><b class="datos__valor">${valor}</b></div>`).join('')}</div>`;

function bloqueHistorial(h) {
  return `
    ${datos([[`Mínimo (${h.dias} días)`, dinero(h.minimo)], ['Máximo', dinero(h.maximo)], ['Promedio', dinero(h.promedio)], ['Fecha del mínimo', fecha(h.fechaMinimo)]])}
    <div class="caja" id="grafico"></div>`;
}

function bloqueAlerta(p) {
  const sugerido = Math.floor((p.tieneOfertas ? p.precio : p.precioReferencia) * 0.92);
  return `
    <div class="caja ficha__alerta">
      <div class="cabecera-icono"><span class="cabecera-icono__icono">${icono('campana', 24)}</span>
        <div><h3>Avísame si baja de precio</h3><p class="texto texto--tenue texto--pequeno">Revisamos los precios varias veces al día y te avisamos en tu cuenta.</p></div></div>
      <form class="formulario formulario--en-linea" id="form-alerta">
        <label class="formulario__campo"><span class="formulario__etiqueta">Precio objetivo</span>
          <span class="formulario__precio">$<input class="formulario__entrada-precio" name="precio" type="number" min="1" step="0.01" value="${sugerido}" required></span></label>
        <button class="boton boton--violeta">Crear alerta</button>
      </form>
    </div>`;
}

// Tabla de especificaciones: etiqueta a la izquierda, valor a la derecha
const especificaciones = (filas) =>
  `<dl class="especificaciones">${filas
    .map((f) => `<div class="especificaciones__fila" title="${esc(f.ayuda ?? '')}"><dt class="especificaciones__nombre">${esc(f.etiqueta)}</dt><dd class="especificaciones__valor">${esc(f.valor)}</dd></div>`)
    .join('')}</dl>`;

function bloqueAnalisis(a) {
  const lista = (items, tipo) =>
    items.length
      ? `<ul class="pros-contras__lista">${items
          .map((r) => `<li class="pros-contras__item">${icono(tipo === 'pros' ? 'check' : 'x', 18, tipo === 'pros' ? 'icono--verde' : 'icono--rojo')}<span>${esc(r.texto)}<small class="pros-contras__detalle">${esc(r.valor)}</small></span></li>`)
          .join('')}</ul>`
      : '<p class="texto texto--tenue texto--pequeno">Nada destacable.</p>';
  const barras = a.procesador.desglose
    .slice(0, 6)
    .map(
      (x) => `<div class="barras__fila"><span>${esc(x.etiqueta)}</span>
        <span class="barras__pista"><i class="barras__relleno" style="width:${Math.min(100, (x.aporte / x.peso) * 100)}%"></i></span>
        <b class="barras__valor">${x.aporte.toFixed(1)}/${x.peso}</b></div>`,
    )
    .join('');
  const grupos = a.grupos.map((g) => `<h3 class="ficha__subtitulo">${esc(g.nombre)}</h3>${especificaciones(g.filas)}`).join('');
  const similares = a.similares
    .map((s) => `<a href="/comparar.html?categoria=CPU&ids=${a.procesador.id},${s.id}">${esc(s.nombreCompleto)}</a>`)
    .join(' · ');
  return `
    <div class="caja ficha__puntaje">
      <div class="fila fila--entre">
        <div><span class="seccion__antetitulo">Puntuación ArmadorPC</span><b class="ficha__puntos">${a.procesador.puntos}</b>
          <span class="texto texto--tenue"> / 100 · puesto ${a.procesador.posicion} de ${a.total}</span></div>
        <div class="texto texto--tenue texto--pequeno">${a.procesador.puntosPorDolar} puntos por cada $100</div>
      </div>
      <div class="barras">${barras}</div>
    </div>
    <div class="pros-contras">
      <div class="caja"><h3>A favor</h3>${lista(a.aFavor, 'pros')}</div>
      <div class="caja"><h3>En contra</h3>${lista(a.enContra, 'contras')}</div>
    </div>
    ${grupos}
    ${a.similares.length ? `<p class="ficha__similares">Compáralo con: ${similares}</p>` : ''}`;
}

function bloqueResenas(d) {
  const u = usuario();
  const mia = u ? d.resenas.find((r) => r.usuario.id === u.id) : null;
  const resenas = d.resenas.length
    ? d.resenas
        .map(
          (r) => `<div class="resena">
            <div class="fila fila--entre"><div class="fila"><span class="avatar">${esc(r.usuario.nombre[0])}</span><b>${esc(r.usuario.nombre)}</b></div>
              <span class="texto texto--pequeno texto--tenue">${fecha(r.fecha)}</span></div>
            <div class="resena__estrellas">${estrellas(r.calificacion)}</div><p>${esc(r.comentario)}</p>
            ${u && (u.id === r.usuario.id || u.esAdmin) ? `<button class="enlace enlace--peligro" data-borrar-resena="${r.id}">Eliminar</button>` : ''}
          </div>`,
        )
        .join('')
    : '<p class="texto texto--tenue">Todavía no hay reseñas. ¡Cuenta tu experiencia!</p>';
  const estrellasOpciones = [5, 4, 3, 2, 1].map((n) => `<option value="${n}" ${mia?.calificacion === n ? 'selected' : ''}>${'★'.repeat(n)} (${n})</option>`).join('');
  const formulario = u
    ? `<form class="formulario" id="form-resena">
        <label class="formulario__campo"><span class="formulario__etiqueta">Calificación</span><select name="calificacion">${estrellasOpciones}</select></label>
        <label class="formulario__campo"><span class="formulario__etiqueta">Comentario</span>
          <textarea name="comentario" rows="4" minlength="10" maxlength="1000" required placeholder="¿Qué tal funciona? ¿Lo recomendarías?">${esc(mia?.comentario ?? '')}</textarea></label>
        <button class="boton boton--violeta">Publicar reseña</button>
      </form>`
    : `<p class="texto texto--tenue">Inicia sesión para dejar tu opinión.</p><button class="boton boton--violeta" data-ingresar>Ingresar</button>`;
  return `
    <div class="grilla grilla--2">
      <div class="caja">${resenas}</div>
      <div class="caja caja--pila">
        <h3>${mia ? 'Edita tu reseña' : 'Escribe una reseña'}</h3>
        ${formulario}
        <p><button class="enlace" id="reportar">${icono('bandera', 14)} Reportar un dato incorrecto</button></p>
      </div>
    </div>`;
}

async function iniciar() {
  if (!id) return (location.href = '/componentes.html');
  try {
    const [d, h] = await Promise.all([api(`/componentes/${id}`), api(`/componentes/${id}/historial`).catch(() => null)]);
    await sesion;
    const p = d.producto;
    document.title = `${p.nombreCompleto} · precios en Ecuador · ArmadorPC`;
    $('#migas').innerHTML += ` / <a class="cabecera-pagina__miga" href="/componentes.html?categoria=${d.categoria.codigo}">${esc(d.categoria.plural)}</a> / ${esc(p.nombre)}`;
    $('#cabecera').innerHTML = cabecera(d);

    let analisis = null;
    if (d.esCpu) analisis = await api(`/procesadores/${id}/analisis`).catch(() => null);

    const secciones = [
      ['precios', 'Precios', `<h2 class="ficha__encabezado">Precios en tiendas</h2>${tablaOfertas(d.ofertas)}`],
      ['historial', 'Historial', `<h2 class="ficha__encabezado">Historial de precios</h2>${h ? bloqueHistorial(h) : '<div class="vacio">Sin historial todavía.</div>'}${bloqueAlerta(p)}`],
      ['especificaciones', 'Especificaciones', `<h2 class="ficha__encabezado">Especificaciones</h2>${especificaciones(d.ficha)}
        ${d.categoria.queMirar ? `<div class="aviso aviso--info ficha__consejo"><b>Qué mirar en ${esc(d.categoria.nombre.toLowerCase())}:</b> ${esc(d.categoria.queMirar)}</div>` : ''}`],
      ...(analisis ? [['analisis', 'Análisis', `<h2 class="ficha__encabezado">Análisis del procesador</h2>${bloqueAnalisis(analisis)}`]] : []),
      ['resenas', `Reseñas (${d.calificacion.total})`, `<h2 class="ficha__encabezado">Reseñas</h2>${bloqueResenas(d)}`],
      ...(d.similares.length ? [['similares', 'Similares', `<h2 class="ficha__encabezado">Alternativas parecidas</h2><div class="grilla grilla--4" id="similares">${d.similares.map((s) => tarjetaProducto(s)).join('')}</div>`]] : []),
    ];
    $('#nav-ficha').innerHTML = secciones.map(([ancla, texto]) => `<a class="ficha-nav__enlace" href="#${ancla}">${texto}</a>`).join('');
    $('#bloques').innerHTML = secciones.map(([ancla, , html]) => `<div class="ficha__bloque" id="${ancla}">${html}</div>`).join('');
    if (h) graficoHistorial($('#grafico'), h);
    if ($('#similares')) activarTarjetas($('#similares'), d.similares);
    conectar(d);
  } catch (e) {
    if (e.estado === 404) {
      $('#cabecera').innerHTML = '<div class="vacio ficha__no-existe">Este componente no existe o fue eliminado. <a href="/componentes.html">Volver a la biblioteca</a></div>';
    } else errorEn($('#cabecera'), e);
  }
}

function conectar(d) {
  const p = d.producto;
  $('#agregar').addEventListener('click', () => {
    ponerEnPc(d.categoria.codigo, p.id);
    aviso(`${p.nombre} añadido a tu PC`);
    $('#agregar').innerHTML = `${icono('check')} En tu PC · <u>abrir configurador</u>`;
    $('#agregar').onclick = () => (location.href = '/configurador.html');
  });
  $('#comparar').addEventListener('click', () => {
    const activo = alternarComparar(p);
    $('#comparar span').textContent = activo ? 'En comparación' : 'Comparar';
  });
  $('#favorito').addEventListener('click', () =>
    conSesion(async () => {
      const r = await enviar(`/favoritos/${p.id}`);
      $('#favorito').classList.toggle('boton--favorito', r.favorito);
      aviso(r.favorito ? 'Guardado en favoritos' : 'Quitado de favoritos');
    }).catch((e) => e.estado !== 401 && aviso(e.message, 'error')),
  );
  if (usuario()) api('/favoritos').then(({ ids }) => $('#favorito').classList.toggle('boton--favorito', ids.includes(p.id))).catch(() => {});
  $('#form-alerta')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const precioObjetivo = Number(e.target.precio.value);
    conSesion(() => enviar('/alertas', { componenteId: p.id, precioObjetivo }))
      .then(() => aviso(`Te avisaremos cuando baje de ${dinero(precioObjetivo)}`))
      .catch((er) => er.estado !== 401 && aviso(er.message, 'error'));
  });
  $('#form-resena')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      const r = await enviar(`/componentes/${p.id}/resenas`, { calificacion: Number(f.calificacion.value), comentario: f.comentario.value.trim() });
      aviso(r.mensaje);
      setTimeout(() => location.reload(), 600);
    } catch (er) {
      aviso(er.message, 'error');
    }
  });
  document.querySelectorAll('[data-borrar-resena]').forEach((b) =>
    b.addEventListener('click', async () => {
      if (!(await confirmar({ titulo: '¿Eliminar esta reseña?' }))) return;
      await borrar(`/resenas/${b.dataset.borrarResena}`);
      location.reload();
    }),
  );
  document.querySelector('[data-ingresar]')?.addEventListener('click', irAIngresar);
  $('#reportar').addEventListener('click', () => {
    if (!usuario()) return irAIngresar();
    const m = modal({
      titulo: 'Reportar un dato incorrecto',
      ancho: 520,
      contenido: `<form class="formulario" id="form-reporte"><p class="texto texto--tenue">¿Qué dato está mal? (precio, especificación, foto…)</p>
        <textarea name="mensaje" rows="4" minlength="5" maxlength="500" required></textarea><button class="boton boton--violeta">Enviar reporte</button></form>`,
    });
    m.cuerpo.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const r = await enviar(`/componentes/${p.id}/reportes`, { mensaje: e.target.mensaje.value.trim() });
        m.cerrar();
        aviso(r.mensaje);
      } catch (er) {
        aviso(er.message, 'error');
      }
    });
  });
}

iniciar();
