import { montar } from '../js/layout.js';
import { api } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, errorEn, esc, fecha, imagen, param } from '../js/util.js';
import { tarjetaGuia } from '../js/tarjetas.js';

montar('guias');

api(`/guias/${encodeURIComponent(param('slug') ?? '')}`)
  .then((g) => {
    document.title = `${g.titulo} · ArmadorPC`;
    // El contenido HTML lo escribe el equipo del proyecto (semilla), no los usuarios
    $('#articulo').innerHTML = `
      <div class="migas"><a href="/">Inicio</a> / <a href="/guias.html">Guías</a></div>
      <div class="chips">${String(g.etiquetas).split(',').map((e) => `<span>${esc(e.trim())}</span>`).join('')}</div>
      <h1 style="font-size:clamp(30px,4vw,44px);margin:14px 0 10px">${esc(g.titulo)}</h1>
      <p class="tenue">${esc(g.resumen)}</p>
      <p class="pequeno tenue" style="margin-top:8px">${icono('reloj', 14)} ${g.minutosLectura} min · ${fecha(g.fecha)}</p>
      <div class="portada">${imagen(g.imagenUrl, g.titulo)}</div>
      <p class="pequeno tenue" style="margin-bottom:24px">${esc(g.imagenCredito ?? '')}</p>
      <div class="contenido-guia">${g.contenido}</div>
      ${g.enlaceAccion ? `<div class="banda-cta" style="margin-top:30px"><div><h2 style="font-size:24px">Ponlo en práctica</h2></div><a class="boton grande" href="${esc(g.enlaceAccion)}">${esc(g.textoAccion)}</a></div>` : ''}`;
    $('#otras').innerHTML = (g.otras ?? []).slice(0, 3).map(tarjetaGuia).join('');
  })
  .catch((e) => {
    if (e.estado === 404) $('#articulo').innerHTML = '<div class="vacio">Esta guía no existe. <a href="/guias.html">Ver todas las guías</a></div>';
    else errorEn($('#articulo'), e);
  });
