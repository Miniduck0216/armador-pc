// Sección "Tablero": cifras generales, estado de los precios y últimos usuarios
import { api } from '../../js/api.js';
import { esc, hace } from '../../js/util.js';

export default {
  titulo: 'Tablero',
  icono: 'grafica',
  permiso: 'panel.ver',

  async html() {
    const d = await api('/admin/tablero');
    const c = d.cifras;
    const cifras = [
      ['Usuarios', c.usuarios], ['Componentes', c.componentes], ['Precios activos', c.ofertas], ['Armados', c.armados],
      ['Reseñas', c.resenas], ['Reportes pendientes', c.reportes], ['Alertas', c.alertas],
    ];
    const modo = d.precios.modo === 'real' ? 'real (tiendas de Ecuador)' : 'demostración';
    return `
      <div class="cifras">${cifras.map(([t, v]) => `<div class="caja cifras__cifra"><b class="cifras__numero">${v}</b><small class="cifras__etiqueta">${t}</small></div>`).join('')}</div>
      <div class="grilla grilla--2">
        <div class="caja caja--pila"><h3>Precios</h3>
          <p>Modo <b>${modo}</b> · última actualización ${hace(d.precios.ultimaActualizacion)}</p>
          ${d.precios.error ? `<div class="aviso aviso--error">${esc(d.precios.error)}</div>` : ''}
          <div><button class="boton boton--secundario boton--pequeno" data-ir="precios">Ver tiendas</button></div></div>
        <div class="caja caja--pila"><h3>Últimos usuarios</h3>
          <ul class="cifras__lista">${d.ultimosUsuarios.map((u) => `<li>${esc(u.nombre)} <span class="texto texto--tenue texto--pequeno">${esc(u.correo)}</span></li>`).join('')}</ul></div>
      </div>`;
  },
};
