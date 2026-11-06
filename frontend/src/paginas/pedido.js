import { montar } from '../js/layout.js';
import { api } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, aviso, copiar, dinero, errorEn, esc, param } from '../js/util.js';
import { idsPc } from '../js/estado.js';

montar('armar');

// Piezas: del enlace (?ids=) o del PC que el visitante está armando
const ids = [...new Set((param('ids') ?? idsPc().join(',')).split(',').map(Number).filter(Boolean))].slice(0, 20);

// Solo enlaces http(s) para no abrir esquemas raros desde los datos de la tienda
const enlaceSeguro = (u) => (/^https?:\/\//.test(u || '') ? esc(u) : '#');

function textoLista(d) {
  const lineas = ['Lista de compra · ArmadorPC', ''];
  for (const g of d.compraPorTienda) {
    lineas.push(`${g.tienda.nombre} (envío ${dinero(g.envio)})`);
    for (const p of g.productos) lineas.push(`  - ${p.nombre}: ${dinero(p.precio)}`);
    lineas.push(`  Total en ${g.tienda.nombre}: ${dinero(g.total)}`, '');
  }
  if (d.unaTienda) lineas.push(`Todo en ${d.unaTienda.tienda.nombre}: ${dinero(d.unaTienda.total)}`);
  lineas.push(`Total recomendado: ${dinero(d.total)}`, 'Precios de hoy; pueden cambiar.');
  return lineas.join('\n');
}

function pintar(d) {
  const recomienda = d.recomendado;
  $('#cabecera').innerHTML = `
    <div class="migas"><a href="/">Inicio</a> / <a href="/configurador.html">Configurador</a> / Lista de compra</div>
    <h1>Lista de compra</h1>
    <p>Dónde comprar cada pieza para pagar lo menos posible, con los precios de hoy.</p>`;

  const grupos = d.compraPorTienda
    .map(
      (g) => `
      <div class="caja grupo-tienda" style="border-left:4px solid ${esc(g.tienda.color || 'var(--violeta)')}">
        <div class="fila entre"><h3>${esc(g.tienda.nombre)}</h3><span class="tenue pequeno">Envío ${dinero(g.envio)}</span></div>
        <ul class="lista-pedido">
          ${g.productos
            .map(
              (p) => `<li>
                <span class="nombre">${esc(p.nombre)}${p.enStock ? '' : ' <em class="tenue">(sin stock)</em>'}</span>
                <span class="precio">${dinero(p.precio)}</span>
                <a class="pequeno" href="${enlaceSeguro(p.url)}" target="_blank" rel="noopener noreferrer">Ver en tienda ${icono('externo', 14)}</a>
              </li>`,
            )
            .join('')}
        </ul>
        <div class="fila entre pedido-total"><span>Subtotal ${dinero(g.subtotal)} + envío</span><b>${dinero(g.total)}</b></div>
      </div>`,
    )
    .join('');

  const opciones = `
    <div class="opciones-pedido">
      <div class="caja ${recomienda === 'separado' ? 'recomendada' : ''}">
        <small class="antetitulo">Por separado</small>
        <b>${dinero(d.totalSeparado)}</b>
        <span class="tenue pequeno">Cada pieza en la tienda más barata (${d.compraPorTienda.length} ${d.compraPorTienda.length === 1 ? 'tienda' : 'tiendas'})</span>
        ${recomienda === 'separado' ? '<span class="insignia">Recomendada</span>' : ''}
      </div>
      <div class="caja ${recomienda === 'unaTienda' ? 'recomendada' : ''}">
        <small class="antetitulo">Todo en una tienda</small>
        ${
          d.unaTienda
            ? `<b>${dinero(d.unaTienda.total)}</b><span class="tenue pequeno">En ${esc(d.unaTienda.tienda.nombre)} con todas las piezas en stock</span>${recomienda === 'unaTienda' ? '<span class="insignia">Recomendada</span>' : ''}`
            : '<span class="tenue pequeno">Ninguna tienda tiene todas las piezas en stock</span>'
        }
      </div>
    </div>`;

  const alertas = [
    d.sinOferta.length ? `<div class="aviso error">Sin precio disponible hoy: ${d.sinOferta.map(esc).join(', ')}.</div>` : '',
    d.sinStock.length ? `<div class="aviso alerta">Sin stock en ninguna tienda: ${d.sinStock.map(esc).join(', ')}. Revísalo antes de comprar.</div>` : '',
  ].join('');

  const texto = textoLista(d);
  const asunto = encodeURIComponent('Lista de compra ArmadorPC');
  $('#cuerpo').innerHTML = `
    <div>
      ${opciones}
      ${alertas}
      ${grupos || '<div class="vacio">No encontramos precios para estas piezas.</div>'}
    </div>
    <aside class="resumen-config">
      <div class="caja sombra apilado">
        <span class="antetitulo" style="margin:0">Total recomendado</span>
        <div class="total">${dinero(d.total)}</div>
        ${d.ahorro > 0 ? `<div class="variacion baja" style="font-size:15px">Comprar todo en ${esc(d.unaTienda.tienda.nombre)} te ahorra ${dinero(d.ahorro)}</div>` : '<div class="tenue pequeno">Comprar por separado es lo más barato hoy.</div>'}
        <div class="pedido-acciones">
          <button class="boton violeta" id="copiar-lista">${icono('copiar', 16)} Copiar lista</button>
          <a class="boton secundario" href="https://wa.me/?text=${encodeURIComponent(texto)}" target="_blank" rel="noopener noreferrer">${icono('compartir', 16)} Enviar por WhatsApp</a>
          <a class="boton secundario" href="mailto:?subject=${asunto}&body=${encodeURIComponent(texto)}">${icono('compartir', 16)} Enviar por correo</a>
          <button class="boton secundario" id="copiar-enlace">${icono('externo', 16)} Copiar enlace de esta lista</button>
        </div>
        <p class="pequeno tenue">Los precios vienen de las tiendas consultadas. Confirma el precio y el stock en la tienda antes de pagar.</p>
      </div>
    </aside>`;

  $('#copiar-lista').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(texto);
      aviso('Lista copiada');
    } catch {
      alert(texto);
    }
  });
  $('#copiar-enlace').addEventListener('click', () => copiar(location.href));
}

async function iniciar() {
  if (!ids.length) {
    $('#cabecera').innerHTML = `<h1>Lista de compra</h1><p>Todavía no hay piezas para comprar.</p>`;
    $('#cuerpo').innerHTML = `<div class="vacio">Arma tu PC en el configurador y luego vuelve aquí. <br><a class="boton violeta" href="/configurador.html" style="margin-top:12px">${icono('pc', 16)} Ir al configurador</a></div>`;
    return;
  }
  try {
    pintar(await api(`/pedido?ids=${ids.join(',')}`));
  } catch (e) {
    $('#cabecera').innerHTML = `<h1>Lista de compra</h1>`;
    errorEn($('#cuerpo'), e);
  }
}
iniciar();
