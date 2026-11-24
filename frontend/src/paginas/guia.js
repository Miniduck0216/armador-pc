import { montar } from '../js/layout.js';
import { api } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, errorEn, esc, fecha, imagen, param } from '../js/util.js';
import { chips, tarjetaGuia } from '../js/tarjetas.js';

montar('guias');

api(`/guias/${encodeURIComponent(param('slug') ?? '')}`)
  .then((g) => {
    document.title = `${g.titulo} · ArmadorPC`;
    // El contenido HTML lo escribe el equipo del proyecto (semilla), no los usuarios
    const etiquetas = String(g.etiquetas).split(',').map((e) => e.trim());
    const accion = g.enlaceAccion
      ? `<div class="banda-cta articulo__accion"><h2>Ponlo en práctica</h2><a class="boton boton--grande" href="${esc(g.enlaceAccion)}">${esc(g.textoAccion)}</a></div>`
      : '';
    $('#articulo').innerHTML = `
      <div class="cabecera-pagina__migas"><a class="cabecera-pagina__miga" href="/">Inicio</a> / <a class="cabecera-pagina__miga" href="/guias.html">Guías</a></div>
      ${chips(etiquetas)}
      <h1 class="articulo__titulo">${esc(g.titulo)}</h1>
      <p class="texto texto--tenue">${esc(g.resumen)}</p>
      <p class="articulo__datos">${icono('reloj', 14)} ${g.minutosLectura} min · ${fecha(g.fecha)}</p>
      <div class="articulo__portada">${imagen(g.imagenUrl, g.titulo, 'articulo__imagen')}</div>
      <p class="articulo__credito">${esc(g.imagenCredito ?? '')}</p>
      <div class="articulo__contenido">${g.contenido}</div>
      ${accion}`;
    $('#otras').innerHTML = (g.otras ?? []).slice(0, 3).map(tarjetaGuia).join('');
  })
  .catch((e) => {
    if (e.estado === 404) $('#articulo').innerHTML = '<div class="vacio">Esta guía no existe. <a href="/guias.html">Ver todas las guías</a></div>';
    else errorEn($('#articulo'), e);
  });
