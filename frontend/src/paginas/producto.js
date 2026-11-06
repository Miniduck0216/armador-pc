import { montar, usuario } from '../js/layout.js';
import { api, conSesion, enviar, borrar, irAIngresar } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, aviso, dinero, errorEn, esc, estrellas, fecha, hace, imagen, insigniaGama, modal, param, variacion } from '../js/util.js';
import { activarTarjetas, tarjetaProducto } from '../js/tarjetas.js';
import { alternarComparar, enComparar, leerPc, ponerEnPc } from '../js/estado.js';
import { graficoHistorial } from '../js/grafico.js';

const sesion = montar('componentes');
const id = Number(param('id'));

const FUENTES = { woocommerce: 'Tienda en línea', aliexpress: 'API de AliExpress', mercadolibre: 'API de Mercado Libre', simulada: 'Precio simulado (demo)' };

function cabecera(d) {
  const p = d.producto;
  const mejor = d.ofertas.find((o) => o.esMejor);
  return `
    <div class="galeria">
      ${imagen(p.imagen, p.nombreCompleto)}
      <div class="credito">${p.imagenEsReferencia ? '<b>Foto de referencia</b> (modelo parecido). ' : ''}${esc(p.imagenCredito ?? '')}</div>
    </div>
    <div class="ficha-info">
      <div class="fila">${insigniaGama(p.gama)}<span class="insignia gris">${esc(d.categoria.nombre)}</span>${p.hayStock ? '<span class="insignia verde">Con stock</span>' : p.tieneOfertas ? '<span class="insignia roja">Sin stock</span>' : ''}</div>
      <h1>${esc(p.nombreCompleto)}</h1>
      ${d.calificacion.total ? `<a href="#resenas" class="pequeno">${estrellas(d.calificacion.promedio)} ${d.calificacion.promedio.toFixed(1)} · ${d.calificacion.total} reseña(s)</a>` : '<a href="#resenas" class="pequeno">Sé el primero en opinar</a>'}
      ${p.destacados?.length ? `<div class="chips" style="margin-top:14px">${p.destacados.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
      ${
        p.tieneOfertas
          ? `<div class="precio-grande"><strong>${dinero(p.precio)}</strong>${variacion(p.variacion)}<span class="tenue">mejor precio hoy</span></div>
             <div class="tenue pequeno">Rango entre tiendas: ${dinero(d.rango.min)} – ${dinero(d.rango.max)} · Referencia ${dinero(p.precioReferencia)}</div>`
          : `<div class="precio-grande"><strong class="tenue">${dinero(p.precioReferencia)}</strong><span class="tenue">precio de referencia</span></div>
             <div class="aviso alerta pequeno" style="margin-top:8px">Ninguna tienda de Ecuador consultada lo tiene publicado ahora. Crea una alerta y te avisamos cuando aparezca o baje.</div>`
      }
      ${
        mejor
          ? `<div class="mejor-oferta">
              <div><small class="tenue">Mejor oferta</small><div><b style="color:${esc(mejor.tienda.color)}">${esc(mejor.tienda.nombre)}</b> · ${mejor.enStock ? 'en stock' : 'sin stock'}${mejor.envio ? ` · envío ${dinero(mejor.envio)}` : ' · envío gratis'}</div></div>
              <a class="boton" href="${esc(mejor.url)}" target="_blank" rel="noopener nofollow">Ir a la tienda ${icono('externo', 16)}</a>
            </div>`
          : ''
      }
      <div class="fila">
        <button class="boton violeta" id="agregar">${icono('mas')} ${leerPc()[d.categoria.codigo] === p.id ? 'Ya está en tu PC' : 'Añadir a mi PC'}</button>
        <button class="boton secundario" id="comparar">${icono('comparar')} <span>${enComparar(p.id) ? 'En comparación' : 'Comparar'}</span></button>
        <button class="boton secundario" id="favorito" title="Guardar en favoritos">${icono('corazon')}</button>
      </div>
    </div>`;
}

function tablaOfertas(ofertas) {
  if (!ofertas.length)
    return '<div class="vacio">Sin precios de tiendas por ahora. El catálogo usa el precio de referencia hasta la próxima actualización.</div>';
  return `
    <div class="tabla-envoltura"><table class="tabla tabla-ofertas">
      <thead><tr><th>Tienda</th><th>Disponibilidad</th><th class="der">Precio</th><th class="der">Envío</th><th class="der">Total</th><th></th></tr></thead>
      <tbody>${ofertas
        .map(
          (o) => `<tr class="${o.esMejor ? 'mejor' : ''}">
            <td><div class="tienda-celda"><span class="punto-color" style="background:${esc(o.tienda.color)}"></span><div>${esc(o.tienda.nombre)}${o.esMejor ? ' <span class="insignia amarilla">Mejor</span>' : ''}
              <span class="titulo-tienda">${o.tituloTienda ? esc(o.tituloTienda) : esc(FUENTES[o.tienda.fuente] ?? '')}${o.tienda.ciudad ? ` · ${esc(o.tienda.ciudad)}` : ''}</span></div></div></td>
            <td>${o.enStock ? `<span class="insignia verde">En stock</span> <span class="pequeno tenue">${o.tienda.diasEntrega ? `${o.tienda.diasEntrega} día(s)` : ''}</span>` : '<span class="insignia roja">Agotado</span>'}</td>
            <td class="der">${dinero(o.precio)}</td>
            <td class="der">${o.envio ? dinero(o.envio) : '<span class="tenue">Gratis</span>'}</td>
            <td class="der"><b>${dinero(o.total)}</b></td>
            <td class="der"><a class="boton pequeno ${o.esMejor ? '' : 'secundario'}" href="${esc(o.url)}" target="_blank" rel="noopener nofollow">Ver ${icono('externo', 14)}</a></td>
          </tr>`,
        )
        .join('')}</tbody>
    </table></div>
    <p class="pequeno tenue" style="margin-top:10px">Precios con IVA (15 %) incluido. Actualizado ${hace(ofertas[0].actualizado)}. Confirma el precio final en la tienda antes de comprar.</p>`;
}

function bloqueHistorial(h) {
  return `
    <div class="resumen-historial">
      <div class="dato"><small>Mínimo (${h.dias} días)</small><b>${dinero(h.minimo)}</b></div>
      <div class="dato"><small>Máximo</small><b>${dinero(h.maximo)}</b></div>
      <div class="dato"><small>Promedio</small><b>${dinero(h.promedio)}</b></div>
      <div class="dato"><small>Fecha del mínimo</small><b>${fecha(h.fechaMinimo)}</b></div>
    </div>
    <div class="caja" id="grafico"></div>`;
}

function bloqueAlerta(p) {
  const sugerido = Math.floor((p.tieneOfertas ? p.precio : p.precioReferencia) * 0.92);
  return `
    <div class="caja">
      <div class="herramienta-cabecera"><span class="icono-caja">${icono('campana', 24)}</span><div><h3>Avísame si baja de precio</h3><p class="tenue pequeno">Revisamos los precios varias veces al día y te avisamos en tu cuenta.</p></div></div>
      <form class="formulario-alerta" id="form-alerta">
        <label class="campo"><span>Precio objetivo</span><span class="campo-precio">$<input name="precio" type="number" min="1" step="0.01" value="${sugerido}" required></span></label>
        <button class="boton violeta">Crear alerta</button>
      </form>
    </div>`;
}

function bloqueAnalisis(a) {
  const lista = (items, tipo) =>
    items.length
      ? `<ul>${items.map((r) => `<li>${icono(tipo === 'pros' ? 'check' : 'x', 18)}<span>${esc(r.texto)}<small>${esc(r.valor)}</small></span></li>`).join('')}</ul>`
      : '<p class="tenue pequeno">Nada destacable.</p>';
  return `
    <div class="caja" style="margin-bottom:18px">
      <div class="fila entre"><div><span class="antetitulo">Puntuación ArmadorPC</span><b class="puntos" style="font-size:34px">${a.procesador.puntos}</b><span class="tenue"> / 100 · puesto ${a.procesador.posicion} de ${a.total}</span></div>
      <div class="tenue pequeno">${a.procesador.puntosPorDolar} puntos por cada $100</div></div>
      <div class="barras" style="margin-top:16px">${a.procesador.desglose
        .slice(0, 6)
        .map((x) => `<div class="barra-h"><span>${esc(x.etiqueta)}</span><span class="pista"><i style="width:${Math.min(100, (x.aporte / x.peso) * 100)}%"></i></span><b>${x.aporte.toFixed(1)}/${x.peso}</b></div>`)
        .join('')}</div>
    </div>
    <div class="pros-contras">
      <div class="caja pros"><h3>A favor</h3>${lista(a.aFavor, 'pros')}</div>
      <div class="caja contras"><h3>En contra</h3>${lista(a.enContra, 'contras')}</div>
    </div>
    ${a.grupos
      .map(
        (g) => `<h3 style="margin:24px 0 10px">${esc(g.nombre)}</h3>
        <dl class="especificaciones caja" style="padding:4px 20px">${g.filas.map((f) => `<div title="${esc(f.ayuda ?? '')}"><dt>${esc(f.etiqueta)}</dt><dd>${esc(f.valor)}</dd></div>`).join('')}</dl>`,
      )
      .join('')}
    ${a.similares.length ? `<p style="margin-top:18px">Compáralo con: ${a.similares.map((s) => `<a href="/comparar.html?categoria=CPU&ids=${a.procesador.id},${s.id}">${esc(s.nombreCompleto)}</a>`).join(' · ')}</p>` : ''}`;
}

function bloqueResenas(d) {
  const u = usuario();
  const mia = u ? d.resenas.find((r) => r.usuario.id === u.id) : null;
  return `
    <div class="grilla" style="grid-template-columns:1fr 1fr;gap:22px">
      <div class="caja">
        ${
          d.resenas.length
            ? d.resenas
                .map(
                  (r) => `<div class="resena"><div class="fila entre"><div class="fila"><span class="avatar">${esc(r.usuario.nombre[0])}</span><b>${esc(r.usuario.nombre)}</b></div><span class="pequeno tenue">${fecha(r.fecha)}</span></div>
                  <div style="margin:6px 0">${estrellas(r.calificacion)}</div><p>${esc(r.comentario)}</p>
                  ${u && (u.id === r.usuario.id || u.esAdmin) ? `<button class="enlace peligro pequeno" data-borrar-resena="${r.id}">Eliminar</button>` : ''}</div>`,
                )
                .join('')
            : '<p class="tenue">Todavía no hay reseñas. ¡Cuenta tu experiencia!</p>'
        }
      </div>
      <div class="caja">
        <h3>${mia ? 'Edita tu reseña' : 'Escribe una reseña'}</h3>
        ${
          u
            ? `<form class="formulario" id="form-resena" style="margin-top:12px">
                <label class="campo"><span>Calificación</span>
                  <select name="calificacion">${[5, 4, 3, 2, 1].map((n) => `<option value="${n}" ${mia?.calificacion === n ? 'selected' : ''}>${'★'.repeat(n)} (${n})</option>`).join('')}</select></label>
                <label class="campo"><span>Comentario</span><textarea name="comentario" rows="4" minlength="10" maxlength="1000" required placeholder="¿Qué tal funciona? ¿Lo recomendarías?">${esc(mia?.comentario ?? '')}</textarea></label>
                <button class="boton violeta">Publicar reseña</button>
              </form>`
            : `<p class="tenue" style="margin:10px 0 14px">Inicia sesión para dejar tu opinión.</p><button class="boton violeta" data-ingresar>Ingresar</button>`
        }
        <p style="margin-top:18px"><button class="enlace pequeno" id="reportar">${icono('bandera', 14)} Reportar un dato incorrecto</button></p>
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
    $('#migas').innerHTML += ` / <a href="/componentes.html?categoria=${d.categoria.codigo}">${esc(d.categoria.plural)}</a> / ${esc(p.nombre)}`;
    $('#cabecera').innerHTML = cabecera(d);

    let analisis = null;
    if (d.esCpu) analisis = await api(`/procesadores/${id}/analisis`).catch(() => null);

    const secciones = [
      ['precios', 'Precios', `<h2>Precios en tiendas</h2>${tablaOfertas(d.ofertas)}`],
      ['historial', 'Historial', `<h2>Historial de precios</h2>${h ? bloqueHistorial(h) : '<div class="vacio">Sin historial todavía.</div>'}<div style="margin-top:18px">${bloqueAlerta(p)}</div>`],
      ['especificaciones', 'Especificaciones', `<h2>Especificaciones</h2><dl class="especificaciones caja" style="padding:4px 20px">${d.ficha.map((f) => `<div><dt>${esc(f.etiqueta)}</dt><dd>${esc(f.valor)}</dd></div>`).join('')}</dl>
        ${d.categoria.queMirar ? `<div class="aviso info" style="margin-top:14px"><b>Qué mirar en ${esc(d.categoria.nombre.toLowerCase())}:</b> ${esc(d.categoria.queMirar)}</div>` : ''}`],
      ...(analisis ? [['analisis', 'Análisis', `<h2>Análisis del procesador</h2>${bloqueAnalisis(analisis)}`]] : []),
      ['resenas', `Reseñas (${d.calificacion.total})`, `<h2>Reseñas</h2>${bloqueResenas(d)}`],
      ...(d.similares.length ? [['similares', 'Similares', `<h2>Alternativas parecidas</h2><div class="grilla g4" id="similares">${d.similares.map((s) => tarjetaProducto(s)).join('')}</div>`]] : []),
    ];
    $('#nav-ficha').innerHTML = secciones.map(([ancla, texto]) => `<a href="#${ancla}">${texto}</a>`).join('');
    $('#bloques').innerHTML = secciones.map(([ancla, , html]) => `<div class="bloque" id="${ancla}">${html}</div>`).join('');
    if (h) graficoHistorial($('#grafico'), h);
    if ($('#similares')) activarTarjetas($('#similares'), d.similares);
    conectar(d);
  } catch (e) {
    if (e.estado === 404) {
      $('#cabecera').innerHTML = '<div class="vacio" style="grid-column:1/-1">Este componente no existe o fue eliminado. <a href="/componentes.html">Volver a la biblioteca</a></div>';
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
      $('#favorito').classList.toggle('activo', r.favorito);
      aviso(r.favorito ? 'Guardado en favoritos' : 'Quitado de favoritos');
    }).catch((e) => e.estado !== 401 && aviso(e.message, 'error')),
  );
  if (usuario()) api('/favoritos').then(({ ids }) => $('#favorito').classList.toggle('activo', ids.includes(p.id))).catch(() => {});
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
      if (!confirm('¿Eliminar esta reseña?')) return;
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
      contenido: `<form class="formulario" id="form-reporte"><p class="tenue">¿Qué dato está mal? (precio, especificación, foto…)</p>
        <textarea name="mensaje" rows="4" minlength="5" maxlength="500" required></textarea><button class="boton violeta">Enviar reporte</button></form>`,
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
