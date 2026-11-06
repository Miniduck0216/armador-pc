import { montar } from '../js/layout.js';
import { actualizar, api, borrar, enviar } from '../js/api.js';
import { icono } from '../js/iconos.js';
import { $, aviso, dinero, errorEn, esc, fecha, hace, modal } from '../js/util.js';

const FUENTES = { woocommerce: 'WooCommerce (tienda en línea)', aliexpress: 'API de afiliados', mercadolibre: 'API pública', simulada: 'Simulada (demo)' };

const CAMPOS_CPU = [
  ['nombre', 'Modelo', 'text'], ['marca', 'Marca', ['AMD', 'Intel']], ['precio', 'Precio de referencia ($)', 'number'],
  ['zocalo', 'Zócalo', 'text'], ['nucleos', 'Núcleos', 'number'], ['hilos', 'Hilos', 'number'],
  ['frecuenciaBase', 'Frecuencia base (GHz)', 'number'], ['frecuenciaTurbo', 'Frecuencia turbo (GHz)', 'number'],
  ['cacheL3', 'Caché L3 (MB)', 'number'], ['tdp', 'TDP (W)', 'number'], ['litografia', 'Litografía (nm)', 'number'],
  ['anioLanzamiento', 'Año', 'number'], ['memoriaSoportada', 'Memoria', ['DDR4', 'DDR5', 'DDR4/DDR5']],
  ['velocidadMemoriaMax', 'Memoria máx. (MHz)', 'number'], ['versionPcie', 'PCIe', 'number'],
  ['cinebenchMono', 'Cinebench R23 mono', 'number'], ['cinebenchMulti', 'Cinebench R23 multi', 'number'],
  ['nombreGraficos', 'Gráficos integrados (nombre)', 'text'],
  ['graficosIntegrados', 'Tiene gráficos integrados', 'casilla'], ['desbloqueado', 'Multiplicador desbloqueado', 'casilla'],
];

const SECCIONES = {
  tablero: ['Tablero', 'grafica', tablero],
  precios: ['Tiendas y precios', 'tienda', precios],
  procesadores: ['Procesadores', 'chip', procesadores],
  usuarios: ['Usuarios', 'usuario', usuarios],
  reportes: ['Reportes', 'bandera', reportes],
  reglas: ['Reglas de compatibilidad', 'escudo', reglas],
};

const contenido = () => $('#contenido');

async function tablero() {
  const d = await api('/admin/tablero');
  const c = d.cifras;
  return `
    <div class="cifras-panel">${[
      ['Usuarios', c.usuarios], ['Componentes', c.componentes], ['Precios activos', c.ofertas], ['Armados', c.armados],
      ['Reseñas', c.resenas], ['Reportes pendientes', c.reportes], ['Alertas', c.alertas],
    ].map(([t, v]) => `<div class="caja"><b>${v}</b><small>${t}</small></div>`).join('')}</div>
    <div class="grilla g2">
      <div class="caja"><h3>Precios</h3>
        <p style="margin-top:8px">Modo <b>${d.precios.modo === 'real' ? 'real (tiendas de Ecuador)' : 'demostración'}</b> · última actualización ${hace(d.precios.ultimaActualizacion)}</p>
        ${d.precios.error ? `<div class="aviso error" style="margin-top:10px">${esc(d.precios.error)}</div>` : ''}
        <button class="boton secundario pequeno" data-ir="precios" style="margin-top:12px">Ver tiendas</button></div>
      <div class="caja"><h3>Últimos usuarios</h3><ul style="margin:10px 0 0;padding-left:18px">${d.ultimosUsuarios.map((u) => `<li>${esc(u.nombre)} <span class="tenue pequeno">${esc(u.correo)}</span></li>`).join('')}</ul></div>
    </div>`;
}

async function precios() {
  const d = await api('/admin/precios');
  const e = d.estado;
  return `
    <div class="caja" style="margin-bottom:18px">
      <div class="fila entre">
        <div><h3>Modo ${e.modo === 'real' ? 'real' : 'demostración'}</h3>
          <p class="tenue pequeno">${e.modo === 'real' ? 'Consulta las tiendas cada 6 horas.' : 'Precios simulados cada hora. Para usar tiendas reales arranca con PRECIOS_MODO=real.'}
          Última actualización: ${hace(d.ultimaActualizacion)}.</p></div>
        <button class="boton violeta" id="actualizar-precios" ${e.enCurso ? 'disabled' : ''}>${icono('actualizar', 16)} ${e.enCurso ? 'Actualizando…' : 'Actualizar ahora'}</button>
      </div>
      ${e.resultado ? `<pre class="pequeno" style="background:var(--panel-2);padding:10px;border-radius:10px;overflow:auto;margin:12px 0 0">${esc(JSON.stringify(e.resultado, null, 2))}</pre>` : ''}
      ${e.error ? `<div class="aviso error" style="margin-top:10px">${esc(e.error)}</div>` : ''}
      <p class="pequeno" style="margin-top:10px">Claves de API: AliExpress ${d.claves.aliexpress ? '<span class="insignia verde">configurada</span>' : '<span class="insignia gris">sin clave</span>'} · Mercado Libre ${d.claves.mercadolibre ? '<span class="insignia verde">configurada</span>' : '<span class="insignia gris">sin clave</span>'}</p>
    </div>
    <div class="fila" style="justify-content:flex-end;margin-bottom:12px"><button class="boton secundario" data-oferta-nueva>${icono('mas', 16)} Cargar precio manual</button></div>
    <div class="tabla-envoltura"><table class="tabla">
      <thead><tr><th>Tienda</th><th>Fuente</th><th class="der">Precios</th><th>Última consulta</th><th>Activa</th></tr></thead>
      <tbody>${d.tiendas
        .map(
          (t) => `<tr><td><div class="tienda-celda fila"><span class="punto-color" style="background:${esc(t.color)}"></span><div><a href="${esc(t.sitioWeb)}" target="_blank" rel="noopener"><b>${esc(t.nombre)}</b></a><div class="pequeno tenue">${esc([...new Set([t.ciudad, t.pais].filter(Boolean))].join(', '))}</div></div></div></td>
            <td class="pequeno">${esc(FUENTES[t.fuente] ?? t.fuente)}</td>
            <td class="der">${t.ofertas}<div class="pequeno tenue">${t.conStock} con stock</div></td>
            <td class="pequeno">${t.ultimaSincronizacion ? hace(t.ultimaSincronizacion) : hace(t.actualizado)}${t.ultimoError ? `<div style="color:var(--rojo)">${esc(t.ultimoError)}</div>` : ''}</td>
            <td><label class="interruptor"><input type="checkbox" data-tienda="${t.id}" ${t.activa ? 'checked' : ''}><span></span></label></td></tr>`,
        )
        .join('')}</tbody></table></div>`;
}

async function procesadores() {
  const lista = await api('/admin/procesadores');
  return `
    <div class="fila entre" style="margin-bottom:14px"><p class="tenue">${lista.length} procesadores. Los puntajes se recalculan al guardar.</p><button class="boton violeta" data-cpu-nuevo>${icono('mas', 16)} Nuevo procesador</button></div>
    <div class="tabla-envoltura"><table class="tabla">
      <thead><tr><th>#</th><th>Procesador</th><th>Zócalo</th><th class="der">Puntos</th><th class="der">Precio</th><th></th></tr></thead>
      <tbody>${lista
        .map(
          (p) => `<tr><td>${p.posicion}</td><td><a href="/producto.html?id=${p.id}"><b>${esc(p.nombreCompleto)}</b></a><div class="pequeno tenue">${p.nucleos}/${p.hilos} · ${p.tdp} W</div></td>
            <td>${esc(p.zocalo)}</td><td class="der"><b class="puntos">${p.puntos}</b></td><td class="der">${dinero(p.precio)}</td>
            <td class="der"><button class="enlace" data-cpu-editar="${p.id}">Editar</button> · <button class="enlace peligro" data-cpu-borrar="${p.id}">Eliminar</button></td></tr>`,
        )
        .join('')}</tbody></table></div>`;
}

function formularioCpu(p = {}) {
  const valor = (k) => (p.precioReferencia && k === 'precio' ? p.precioReferencia : p[k]) ?? '';
  const m = modal({
    titulo: p.id ? `Editar ${p.nombreCompleto}` : 'Nuevo procesador',
    contenido: `<form class="formulario" id="form-cpu"><div class="aviso error oculto" id="err-cpu"></div><div class="dos-campos">${CAMPOS_CPU.map(([k, t, tipo]) =>
      tipo === 'casilla'
        ? `<label class="casilla"><input type="checkbox" name="${k}" ${p[k] ? 'checked' : ''}> ${t}</label>`
        : Array.isArray(tipo)
          ? `<label class="campo"><span>${t}</span><select name="${k}">${tipo.map((o) => `<option ${valor(k) === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`
          : `<label class="campo"><span>${t}</span><input name="${k}" type="${tipo}" ${tipo === 'number' ? 'step="any"' : ''} value="${esc(valor(k))}"></label>`,
    ).join('')}</div><button class="boton violeta">Guardar</button></form>`,
  });
  m.cuerpo.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const cuerpo = {};
    for (const [k, , tipo] of CAMPOS_CPU) cuerpo[k] = tipo === 'casilla' ? f[k].checked : tipo === 'number' ? Number(f[k].value) : f[k].value.trim();
    try {
      if (p.id) await actualizar(`/admin/procesadores/${p.id}`, cuerpo, 'PUT');
      else await enviar('/admin/procesadores', cuerpo);
      m.cerrar();
      aviso('Procesador guardado');
      mostrar('procesadores');
    } catch (er) {
      const el = m.cuerpo.querySelector('#err-cpu');
      el.textContent = er.message;
      el.classList.remove('oculto');
    }
  });
}

async function usuarios() {
  const lista = await api('/admin/usuarios');
  return `<div class="fila" style="justify-content:flex-end;margin-bottom:12px"><button class="boton violeta" data-usuario-nuevo>${icono('mas', 16)} Nuevo usuario</button></div>
  <div class="tabla-envoltura"><table class="tabla">
    <thead><tr><th>Usuario</th><th>Registro</th><th>Último ingreso</th><th>Rol</th><th>Activo</th></tr></thead>
    <tbody>${lista
      .map(
        (u) => `<tr><td><b>${esc(u.nombre)}</b>${u.esYo ? ' <span class="insignia">Tú</span>' : ''}<div class="pequeno tenue">${esc(u.correo)}</div></td>
          <td class="pequeno">${fecha(u.fechaRegistro)}</td><td class="pequeno">${u.ultimoIngreso ? hace(u.ultimoIngreso) : 'nunca'}</td>
          <td><select data-rol="${u.id}" ${u.esYo ? 'disabled' : ''} style="width:auto"><option value="usuario" ${u.rol === 'usuario' ? 'selected' : ''}>Usuario</option><option value="admin" ${u.rol === 'admin' ? 'selected' : ''}>Administrador</option></select></td>
          <td><label class="interruptor"><input type="checkbox" data-activo="${u.id}" ${u.activo ? 'checked' : ''} ${u.esYo ? 'disabled' : ''}><span></span></label></td></tr>`,
      )
      .join('')}</tbody></table></div>`;
}

// Formulario de precio manual. "Categoría" → "Componente" es un menú dependiente:
// al elegir la categoría se cargan solo los componentes de esa categoría.
async function formularioOferta() {
  const [categorias, tiendas] = await Promise.all([api('/categorias'), api('/admin/tiendas')]);
  const m = modal({
    titulo: 'Cargar precio manual',
    contenido: `<form class="formulario" id="form-oferta">
      <div class="aviso error oculto" id="err-oferta"></div>
      <label class="campo"><span>Categoría</span>
        <select name="categoria"><option value="">Elige una categoría…</option>${categorias.map((c) => `<option value="${esc(c.codigo)}">${esc(c.nombre)}</option>`).join('')}</select></label>
      <label class="campo"><span>Componente</span>
        <select name="componenteId" required disabled><option value="">Primero elige la categoría</option></select></label>
      <label class="campo"><span>Tienda</span>
        <select name="tiendaId" required><option value="">Elige una tienda…</option>${tiendas.map((t) => `<option value="${t.id}">${esc(t.nombre)}</option>`).join('')}</select></label>
      <div class="dos-campos">
        <label class="campo"><span>Precio ($)</span><input name="precio" type="number" step="0.01" min="0.01" max="100000" required></label>
        <label class="casilla"><input type="checkbox" name="enStock" checked> Con stock</label>
      </div>
      <label class="campo"><span>Enlace al producto en la tienda</span><input name="url" type="url" maxlength="500" placeholder="https://" required></label>
      <button class="boton violeta">Guardar precio</button>
    </form>`,
  });
  const form = m.cuerpo.querySelector('form');
  const error = (texto) => {
    const el = m.cuerpo.querySelector('#err-oferta');
    el.textContent = texto;
    el.classList.remove('oculto');
  };
  form.categoria.addEventListener('change', async () => {
    const codigo = form.categoria.value;
    form.componenteId.disabled = true;
    form.componenteId.innerHTML = '<option value="">Primero elige la categoría</option>';
    if (!codigo) return;
    form.componenteId.innerHTML = '<option value="">Cargando…</option>';
    try {
      const lista = await api(`/admin/componentes?categoria=${encodeURIComponent(codigo)}`);
      form.componenteId.innerHTML = '<option value="">Elige un componente…</option>' + lista.map((c) => `<option value="${c.id}">${esc(c.marca)} ${esc(c.nombre)}</option>`).join('');
      form.componenteId.disabled = false;
    } catch (er) {
      error(er.message);
    }
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cuerpo = {
      componenteId: Number(form.componenteId.value),
      tiendaId: Number(form.tiendaId.value),
      precio: Number(form.precio.value),
      enStock: form.enStock.checked,
      url: form.url.value.trim(),
    };
    try {
      await enviar('/admin/ofertas', cuerpo);
      m.cerrar();
      aviso('Precio guardado');
      mostrar('precios');
    } catch (er) {
      error(er.message);
    }
  });
}

// Crear cuenta: la validación real (correo, contraseña, rol) la hace el servidor
function formularioUsuario() {
  const m = modal({
    titulo: 'Nuevo usuario',
    ancho: 520,
    contenido: `<form class="formulario" id="form-usuario">
      <div class="aviso error oculto" id="err-usuario"></div>
      <label class="campo"><span>Nombre</span><input name="nombre" required minlength="2" maxlength="60"></label>
      <label class="campo"><span>Correo</span><input name="correo" type="email" required maxlength="120"></label>
      <label class="campo"><span>Contraseña (8 o más caracteres, con letras y números)</span><input name="contrasena" type="password" required minlength="8" maxlength="72" autocomplete="new-password"></label>
      <label class="campo"><span>Rol</span><select name="rol"><option value="usuario">Usuario</option><option value="admin">Administrador</option></select></label>
      <button class="boton violeta">Crear cuenta</button>
    </form>`,
  });
  m.cuerpo.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      await enviar('/admin/usuarios', {
        nombre: f.nombre.value.trim(),
        correo: f.correo.value.trim(),
        contrasena: f.contrasena.value,
        rol: f.rol.value,
      });
      m.cerrar();
      aviso('Cuenta creada');
      mostrar('usuarios');
    } catch (er) {
      const el = m.cuerpo.querySelector('#err-usuario');
      el.textContent = er.message;
      el.classList.remove('oculto');
    }
  });
}

async function reportes() {
  const lista = await api('/admin/reportes');
  return lista.length
    ? `<div class="tabla-envoltura"><table class="tabla"><thead><tr><th>Componente</th><th>Mensaje</th><th>Usuario</th><th>Estado</th><th></th></tr></thead>
      <tbody>${lista
        .map(
          (r) => `<tr><td><a href="/producto.html?id=${r.componente.id}">${esc(r.componente.nombre)}</a><div class="pequeno tenue">${fecha(r.fecha)}</div></td><td>${esc(r.mensaje)}</td><td>${esc(r.usuario ?? '—')}</td>
            <td>${r.estado === 'pendiente' ? '<span class="insignia amarilla">Pendiente</span>' : '<span class="insignia verde">Resuelto</span>'}</td>
            <td>${r.estado === 'pendiente' ? `<button class="boton pequeno secundario" data-resolver="${r.id}">Marcar resuelto</button>` : ''}</td></tr>`,
        )
        .join('')}</tbody></table></div>`
    : '<div class="vacio">No hay reportes.</div>';
}

async function reglas() {
  const lista = await api('/admin/reglas');
  return `<p class="tenue" style="margin-bottom:14px">Reglas que usa el motor de compatibilidad del configurador.</p>
    <div class="tabla-envoltura"><table class="tabla"><thead><tr><th>Regla</th><th>Compara</th><th>Tipo</th><th>Activa</th></tr></thead>
    <tbody>${lista
      .map(
        (r) => `<tr><td><b>${esc(r.nombre)}</b><div class="pequeno tenue">${esc(r.mensajeError)}</div></td>
          <td class="pequeno">${esc(r.categoriaOrigen)}.${esc(r.atributoOrigen)} → ${esc(r.categoriaDestino ?? '')}${r.atributoDestino ? `.${esc(r.atributoDestino)}` : ''}</td>
          <td><span class="insignia gris">${esc(r.tipo)}</span></td><td>${r.activa ? '<span class="insignia verde">Sí</span>' : '<span class="insignia gris">No</span>'}</td></tr>`,
      )
      .join('')}</tbody></table></div>`;
}

let actual = 'tablero';
async function mostrar(clave) {
  actual = SECCIONES[clave] ? clave : 'tablero';
  document.querySelectorAll('#menu [data-ir]').forEach((b) => b.classList.toggle('activa', b.dataset.ir === actual));
  history.replaceState(null, '', `#${actual}`);
  const [titulo, , fn] = SECCIONES[actual];
  try {
    contenido().innerHTML = `<h2 style="margin-bottom:18px">${titulo}</h2>${await fn()}`;
  } catch (e) {
    errorEn(contenido(), e);
  }
}

document.addEventListener('click', async (e) => {
  const t = e.target;
  const ir = t.closest('[data-ir]');
  if (ir) return mostrar(ir.dataset.ir);
  if (t.closest('[data-cpu-nuevo]')) return formularioCpu();
  if (t.closest('[data-oferta-nueva]')) return formularioOferta();
  if (t.closest('[data-usuario-nuevo]')) return formularioUsuario();
  const ed = t.closest('[data-cpu-editar]');
  if (ed) {
    const lista = await api('/admin/procesadores');
    return formularioCpu(lista.find((p) => p.id === Number(ed.dataset.cpuEditar)));
  }
  const bo = t.closest('[data-cpu-borrar]');
  if (bo && confirm('¿Eliminar este procesador? También se borran sus precios y reseñas.')) {
    await borrar(`/admin/procesadores/${bo.dataset.cpuBorrar}`).catch((er) => aviso(er.message, 'error'));
    return mostrar('procesadores');
  }
  const res = t.closest('[data-resolver]');
  if (res) {
    await actualizar(`/admin/reportes/${res.dataset.resolver}/resolver`);
    return mostrar('reportes');
  }
  if (t.closest('#actualizar-precios')) {
    const r = await enviar('/admin/precios/actualizar');
    aviso(r.mensaje);
    setTimeout(() => actual === 'precios' && mostrar('precios'), 2500);
  }
});

document.addEventListener('change', async (e) => {
  const t = e.target;
  try {
    if (t.dataset.tienda) {
      await actualizar(`/admin/tiendas/${t.dataset.tienda}/alternar`);
      aviso(t.checked ? 'Tienda activada' : 'Tienda desactivada');
    } else if (t.dataset.rol) {
      await actualizar(`/admin/usuarios/${t.dataset.rol}`, { rol: t.value });
      aviso('Rol actualizado');
    } else if (t.dataset.activo) {
      await actualizar(`/admin/usuarios/${t.dataset.activo}`, { activo: t.checked });
      aviso(t.checked ? 'Cuenta activada' : 'Cuenta desactivada');
    }
  } catch (er) {
    aviso(er.message, 'error');
  }
});

montar('').then((u) => {
  if (!u) return (location.href = `/ingresar.html?volver=${encodeURIComponent('/admin.html')}`);
  if (!u.esAdmin) {
    contenido().innerHTML = '<div class="aviso error">Esta zona es solo para administradores.</div>';
    return;
  }
  $('#menu').innerHTML = Object.entries(SECCIONES)
    .map(([k, [t, i]]) => `<button data-ir="${k}">${icono(i, 17)} ${t}</button>`)
    .join('');
  mostrar(location.hash.slice(1));
});
