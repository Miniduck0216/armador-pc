import { montar } from '../js/layout.js';
import { api } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, aviso, copiar, dinero, errorEn, esc, mostrarTexto, param } from '../js/util.js';
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

// Una caja por tienda con sus productos, el envío y el total
function grupoTienda(g) {
  const productos = g.productos
    .map(
      (p) => `<li class="pedido__producto">
        <span class="pedido__nombre">${esc(p.nombre)}${p.enStock ? '' : ' <em class="texto texto--tenue">(sin stock)</em>'}</span>
        <span class="pedido__precio">${dinero(p.precio)}</span>
        <a class="pedido__enlace" href="${enlaceSeguro(p.url)}" target="_blank" rel="noopener noreferrer">Ver en tienda ${icono('externo', 14)}</a>
      </li>`,
    )
    .join('');
  // El color de la tienda viene de la base de datos (borde izquierdo)
  return `<div class="caja pedido__tienda" style="border-left-color:${esc(g.tienda.color || '#6b4bff')}">
      <div class="fila fila--entre"><h3>${esc(g.tienda.nombre)}</h3><span class="texto texto--tenue texto--pequeno">Envío ${dinero(g.envio)}</span></div>
      <ul class="pedido__productos">${productos}</ul>
      <div class="fila fila--entre pedido__total"><span>Subtotal ${dinero(g.subtotal)} + envío</span><b>${dinero(g.total)}</b></div>
    </div>`;
}

// Las dos formas de comprar: por separado o todo en una tienda
function opciones(d) {
  const recomienda = d.recomendado;
  const insignia = '<span class="insignia insignia--amarilla pedido__recomendada">Recomendada</span>';
  const opcion = (clave, titulo, contenido) => `<div class="caja caja--pila pedido__opcion ${recomienda === clave ? 'caja--destacada' : ''}">
      <small class="seccion__antetitulo">${titulo}</small>${contenido}${recomienda === clave ? insignia : ''}</div>`;
  const tiendas = d.compraPorTienda.length;
  return `<div class="pedido__opciones">
      ${opcion('separado', 'Por separado', `<b class="pedido__monto">${dinero(d.totalSeparado)}</b><span class="texto texto--tenue texto--pequeno">Cada pieza en la tienda más barata (${tiendas} ${tiendas === 1 ? 'tienda' : 'tiendas'})</span>`)}
      ${opcion(
        'unaTienda',
        'Todo en una tienda',
        d.unaTienda
          ? `<b class="pedido__monto">${dinero(d.unaTienda.total)}</b><span class="texto texto--tenue texto--pequeno">En ${esc(d.unaTienda.tienda.nombre)} con todas las piezas en stock</span>`
          : '<span class="texto texto--tenue texto--pequeno">Ninguna tienda tiene todas las piezas en stock</span>',
      )}
    </div>`;
}

function pintar(d) {
  $('#cabecera').innerHTML = `
    <div class="cabecera-pagina__migas"><a class="cabecera-pagina__miga" href="/">Inicio</a> / <a class="cabecera-pagina__miga" href="/configurador.html">Configurador</a> / Lista de compra</div>
    <h1>Lista de compra</h1>
    <p class="cabecera-pagina__texto">Dónde comprar cada pieza para pagar lo menos posible, con los precios de hoy.</p>`;

  const avisos = [
    d.sinOferta.length ? `<div class="aviso aviso--error">Sin precio disponible hoy: ${d.sinOferta.map(esc).join(', ')}.</div>` : '',
    d.sinStock.length ? `<div class="aviso aviso--alerta">Sin stock en ninguna tienda: ${d.sinStock.map(esc).join(', ')}. Revísalo antes de comprar.</div>` : '',
  ].join('');
  const grupos = d.compraPorTienda.map(grupoTienda).join('');
  const ahorro = d.ahorro > 0
    ? `<div class="variacion variacion--baja resumen-armado__cambio">Comprar todo en ${esc(d.unaTienda.tienda.nombre)} te ahorra ${dinero(d.ahorro)}</div>`
    : '<div class="texto texto--tenue texto--pequeno">Comprar por separado es lo más barato hoy.</div>';

  const texto = textoLista(d);
  const asunto = encodeURIComponent('Lista de compra ArmadorPC');
  $('#cuerpo').innerHTML = `
    <div class="pila">
      ${opciones(d)}
      ${avisos}
      ${grupos || '<div class="vacio">No encontramos precios para estas piezas.</div>'}
    </div>
    <aside class="resumen-armado">
      <div class="caja caja--sombra caja--pila">
        <span class="seccion__antetitulo resumen-armado__etiqueta">Total recomendado</span>
        <div class="resumen-armado__total">${dinero(d.total)}</div>
        ${ahorro}
        <div class="pila pila--chica">
          <button class="boton boton--violeta" id="copiar-lista">${icono('copiar', 16)} Copiar lista</button>
          <a class="boton boton--secundario" href="https://wa.me/?text=${encodeURIComponent(texto)}" target="_blank" rel="noopener noreferrer">${icono('compartir', 16)} Enviar por WhatsApp</a>
          <a class="boton boton--secundario" href="mailto:?subject=${asunto}&body=${encodeURIComponent(texto)}">${icono('compartir', 16)} Enviar por correo</a>
          <button class="boton boton--secundario" id="copiar-enlace">${icono('externo', 16)} Copiar enlace de esta lista</button>
        </div>
        <p class="texto texto--pequeno texto--tenue">Los precios vienen de las tiendas consultadas. Confirma el precio y el stock en la tienda antes de pagar.</p>
      </div>
    </aside>`;

  $('#copiar-lista').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(texto);
      aviso('Lista copiada');
    } catch {
      mostrarTexto('Copia tu lista de compra', texto);
    }
  });
  $('#copiar-enlace').addEventListener('click', () => copiar(location.href));
}

async function iniciar() {
  if (!ids.length) {
    $('#cabecera').innerHTML = `<h1>Lista de compra</h1><p class="cabecera-pagina__texto">Todavía no hay piezas para comprar.</p>`;
    $('#cuerpo').innerHTML = `<div class="vacio pila">Arma tu PC en el configurador y luego vuelve aquí.
      <div><a class="boton boton--violeta" href="/configurador.html">${icono('pc', 16)} Ir al configurador</a></div></div>`;
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
