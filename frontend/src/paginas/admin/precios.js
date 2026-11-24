// Sección "Tiendas y precios": modo de precios, tiendas y carga de un precio manual
import { actualizar, api, enviar } from '../../js/api.js';
import { icono } from '../../js/iconos.js';
import { aviso, errorFormulario, esc, hace, tabla } from '../../js/util.js';
import { campo, casilla, formularioModal, interruptor } from './comun.js';

const FUENTES = { woocommerce: 'WooCommerce (tienda en línea)', aliexpress: 'API de afiliados', mercadolibre: 'API pública', simulada: 'Simulada (demo)' };
const clave = (si) => (si ? '<span class="insignia insignia--verde">configurada</span>' : '<span class="insignia insignia--gris">sin clave</span>');

// Formulario de precio manual. "Categoría" → "Componente" es un desplegable dependiente:
// al elegir la categoría se cargan solo los componentes de esa categoría.
async function formularioOferta(recargar) {
  const [categorias, tiendas] = await Promise.all([api('/categorias'), api('/admin/tiendas')]);
  const form = formularioModal({
    titulo: 'Cargar precio manual',
    boton: 'Guardar precio',
    html: `
      ${campo('Categoría', `<select name="categoria"><option value="">Elige una categoría…</option>${categorias.map((c) => `<option value="${esc(c.codigo)}">${esc(c.nombre)}</option>`).join('')}</select>`)}
      ${campo('Componente', '<select name="componenteId" required disabled><option value="">Primero elige la categoría</option></select>')}
      ${campo('Tienda', `<select name="tiendaId" required><option value="">Elige una tienda…</option>${tiendas.map((t) => `<option value="${t.id}">${esc(t.nombre)}</option>`).join('')}</select>`)}
      <div class="formulario__dos">
        ${campo('Precio ($)', '<input name="precio" type="number" step="0.01" min="0.01" max="100000" required>')}
        ${casilla('Con stock', 'name="enStock" checked')}
      </div>
      ${campo('Enlace al producto en la tienda', '<input name="url" type="url" maxlength="500" placeholder="https://" required>')}`,
    alEnviar: async (f) => {
      await enviar('/admin/ofertas', {
        componenteId: Number(f.componenteId.value),
        tiendaId: Number(f.tiendaId.value),
        precio: Number(f.precio.value),
        enStock: f.enStock.checked,
        url: f.url.value.trim(),
      });
      aviso('Precio guardado');
      recargar();
    },
  });
  // Desplegable dependiente
  form.categoria.addEventListener('change', async () => {
    const codigo = form.categoria.value;
    const destino = form.componenteId;
    destino.disabled = true;
    destino.innerHTML = `<option value="">${codigo ? 'Cargando…' : 'Primero elige la categoría'}</option>`;
    if (!codigo) return;
    try {
      const lista = await api(`/admin/componentes?categoria=${encodeURIComponent(codigo)}`);
      destino.innerHTML = '<option value="">Elige un componente…</option>' + lista.map((c) => `<option value="${c.id}">${esc(c.marca)} ${esc(c.nombre)}</option>`).join('');
      destino.disabled = false;
    } catch (er) {
      errorFormulario(form.querySelector('[data-error]'), er.message);
    }
  });
}

export default {
  titulo: 'Tiendas y precios',
  icono: 'tienda',
  permiso: 'precios.gestionar',

  async html() {
    const d = await api('/admin/precios');
    const e = d.estado;
    const real = e.modo === 'real';
    const filas = d.tiendas.map((t) => [
      `<div class="oferta-tienda"><span class="tienda-fila__color" style="background:${esc(t.color)}"></span>
        <div><a href="${esc(t.sitioWeb)}" target="_blank" rel="noopener"><b>${esc(t.nombre)}</b></a>
        <small class="tabla__detalle">${esc([...new Set([t.ciudad, t.pais].filter(Boolean))].join(', '))}</small></div></div>`,
      `<span class="texto texto--pequeno">${esc(FUENTES[t.fuente] ?? t.fuente)}</span>`,
      [`${t.ofertas}<small class="tabla__detalle">${t.conStock} con stock</small>`, 'derecha'],
      `<span class="texto texto--pequeno">${hace(t.ultimaSincronizacion ?? t.actualizado)}</span>${t.ultimoError ? `<small class="tabla__detalle texto texto--rojo">${esc(t.ultimoError)}</small>` : ''}`,
      interruptor(`data-tienda="${t.id}" ${t.activa ? 'checked' : ''}`),
    ]);
    return `
      <div class="caja caja--pila panel__bloque">
        <div class="fila fila--entre">
          <div><h3>Modo ${real ? 'real' : 'demostración'}</h3>
            <p class="texto texto--tenue texto--pequeno">${real ? 'Consulta las tiendas cada 6 horas.' : 'Precios simulados cada hora. Para usar tiendas reales arranca con PRECIOS_MODO=real.'}
            Última actualización: ${hace(d.ultimaActualizacion)}.</p></div>
          <button class="boton boton--violeta" data-actualizar ${e.enCurso ? 'disabled' : ''}>${icono('actualizar', 16)} ${e.enCurso ? 'Actualizando…' : 'Actualizar ahora'}</button>
        </div>
        ${e.resultado ? `<pre class="panel__codigo">${esc(JSON.stringify(e.resultado, null, 2))}</pre>` : ''}
        ${e.error ? `<div class="aviso aviso--error">${esc(e.error)}</div>` : ''}
        <p class="texto texto--pequeno">Claves de API: AliExpress ${clave(d.claves.aliexpress)} · Mercado Libre ${clave(d.claves.mercadolibre)}</p>
      </div>
      <div class="panel__acciones"><button class="boton boton--secundario" data-nuevo>${icono('mas', 16)} Cargar precio manual</button></div>
      ${tabla(['Tienda', 'Fuente', ['Precios', 'derecha'], 'Última consulta', 'Activa'], filas)}`;
  },

  conectar(zona, { recargar, seccionActual }) {
    zona.querySelector('[data-nuevo]').addEventListener('click', () => formularioOferta(recargar));
    zona.querySelector('[data-actualizar]').addEventListener('click', async () => {
      const r = await enviar('/admin/precios/actualizar');
      aviso(r.mensaje);
      setTimeout(() => seccionActual() === 'precios' && recargar(), 2500);
    });
    // Activar o desactivar una tienda
    zona.addEventListener('change', async (e) => {
      const id = e.target.dataset.tienda;
      if (!id) return;
      try {
        await actualizar(`/admin/tiendas/${id}/alternar`);
        aviso(e.target.checked ? 'Tienda activada' : 'Tienda desactivada');
      } catch (er) {
        e.target.checked = !e.target.checked;
        aviso(er.message, 'error');
      }
    });
  },
};
