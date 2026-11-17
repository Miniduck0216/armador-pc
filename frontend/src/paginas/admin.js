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

// Cada sección indica el permiso que necesita. El menú solo muestra las que el rol
// puede usar; aun así, el backend vuelve a comprobar el permiso en cada petición.
const SECCIONES = {
  tablero: ['Tablero', 'grafica', tablero, 'panel.ver'],
  precios: ['Tiendas y precios', 'tienda', precios, 'precios.gestionar'],
  procesadores: ['Procesadores', 'chip', procesadores, 'componentes.gestionar'],
  componentes: ['Componentes', 'pc', componentes, 'componentes.gestionar'],
  usuarios: ['Usuarios', 'usuario', usuarios, 'usuarios.gestionar'],
  roles: ['Roles y permisos', 'escudo', roles, 'roles.gestionar'],
  revisiones: ['Revisión de armados', 'check', revisiones, 'armados.revisar'],
  reportes: ['Reportes', 'bandera', reportes, 'reportes.gestionar'],
  reglas: ['Reglas de compatibilidad', 'escudo', reglas, 'reglas.ver'],
};

let permisos = [];
const puede = (clave) => permisos.includes(SECCIONES[clave][3]);

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
  const [lista, rolesLista] = await Promise.all([api('/admin/usuarios'), api('/admin/roles-lista')]);
  // El rol es una llave foránea: se elige de la tabla roles, nunca se escribe a mano
  const opcionesRol = (u) => rolesLista.map((r) => `<option value="${r.id}" ${u.rol?.id === r.id ? 'selected' : ''}>${esc(r.nombre)}</option>`).join('');
  return `<div class="fila" style="justify-content:flex-end;margin-bottom:12px"><button class="boton violeta" data-usuario-nuevo>${icono('mas', 16)} Nuevo usuario</button></div>
  <div class="tabla-envoltura"><table class="tabla">
    <thead><tr><th>Usuario</th><th>Registro</th><th>Último ingreso</th><th>Rol</th><th>Activo</th></tr></thead>
    <tbody>${lista
      .map(
        (u) => `<tr><td><b>${esc(u.nombre)}</b>${u.esYo ? ' <span class="insignia">Tú</span>' : ''}<div class="pequeno tenue">${esc(u.correo)}</div></td>
          <td class="pequeno">${fecha(u.fechaRegistro)}</td><td class="pequeno">${u.ultimoIngreso ? hace(u.ultimoIngreso) : 'nunca'}</td>
          <td><select data-rol="${u.id}" ${u.esYo ? 'disabled' : ''} style="width:auto">${opcionesRol(u)}</select></td>
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
async function formularioUsuario() {
  const rolesLista = await api('/admin/roles-lista');
  const m = modal({
    titulo: 'Nuevo usuario',
    ancho: 520,
    contenido: `<form class="formulario" id="form-usuario">
      <div class="aviso error oculto" id="err-usuario"></div>
      <label class="campo"><span>Nombre</span><input name="nombre" required minlength="2" maxlength="60"></label>
      <label class="campo"><span>Correo</span><input name="correo" type="email" required maxlength="120"></label>
      <label class="campo"><span>Contraseña (8 o más caracteres, con letras y números)</span><input name="contrasena" type="password" required minlength="8" maxlength="72" autocomplete="new-password"></label>
      <label class="campo"><span>Rol</span><select name="rolId" required><option value="">Elige un rol…</option>${rolesLista.map((r) => `<option value="${r.id}">${esc(r.nombre)}</option>`).join('')}</select></label>
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
        rolId: Number(f.rolId.value),
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

// Matriz de roles y permisos: una fila por permiso, una columna por rol
async function roles() {
  const d = await api('/admin/roles');
  const modulos = [...new Set(d.permisos.map((p) => p.modulo))];
  return `
    <div class="fila entre" style="margin-bottom:12px">
      <p class="tenue pequeno">Marca qué puede hacer cada rol. El Administrador siempre tiene todos los permisos.</p>
      <button class="boton violeta" data-rol-nuevo>${icono('mas', 16)} Nuevo rol</button>
    </div>
    <div class="tabla-envoltura"><table class="tabla matriz-permisos">
      <thead><tr><th class="matriz-permisos__permiso">Permiso</th>${d.roles
        .map((r) => `<th class="matriz-permisos__rol"><b>${esc(r.nombre)}</b>
          <small class="matriz-permisos__detalle">${r.usuarios} usuario(s)</small>
          ${r.sistema ? '' : `<button class="enlace peligro matriz-permisos__borrar" data-rol-borrar="${r.id}" title="Eliminar rol">${icono('basura', 14)}</button>`}</th>`)
        .join('')}</tr></thead>
      <tbody>${modulos
        .map((m) => `<tr class="matriz-permisos__modulo"><td colspan="${d.roles.length + 1}">${esc(m)}</td></tr>${d.permisos
          .filter((p) => p.modulo === m)
          .map((p) => `<tr><td class="matriz-permisos__permiso">${esc(p.nombre)}<small class="matriz-permisos__detalle">${esc(p.codigo)}</small></td>${d.roles
            .map((r) => `<td class="matriz-permisos__celda"><input type="checkbox" class="matriz-permisos__casilla" data-permiso-rol="${r.id}" value="${esc(p.codigo)}"
              ${r.permisos.includes(p.codigo) ? 'checked' : ''} ${r.bloqueado ? 'disabled' : ''} aria-label="${esc(p.nombre)} para ${esc(r.nombre)}"></td>`)
            .join('')}</tr>`)
          .join('')}`)
        .join('')}</tbody>
    </table></div>

    <div class="caja permisos-usuario">
      <h3>Permisos por usuario</h3>
      <p class="tenue pequeno">Busca a una persona y marca qué puede hacer. Se parte de los permisos de su rol; lo que marques o desmarques solo cambia para ella.</p>
      <input class="permisos-usuario__buscar" type="search" id="buscar-usuario" placeholder="Nombre o correo…" autocomplete="off">
      <div class="permisos-usuario__resultados" id="resultados-usuario"></div>
      <div id="permisos-de-usuario"></div>
    </div>`;
}

// ---- Permisos de una persona ----
async function buscarUsuariosPermisos(texto) {
  const lista = await api(`/admin/permisos-usuarios?buscar=${encodeURIComponent(texto)}`);
  $('#resultados-usuario').innerHTML = lista.length
    ? lista.map((u) => `<button class="permisos-usuario__persona" data-ver-permisos="${u.id}"><b>${esc(u.nombre)}</b> <span class="tenue pequeno">${esc(u.correo)} · ${esc(u.rol)}</span></button>`).join('')
    : '<p class="tenue pequeno">Sin resultados.</p>';
}

async function verPermisosDe(id) {
  const d = await api(`/admin/permisos-usuarios/${id}`);
  const u = d.usuario;
  const bloqueado = u.esAdmin;
  const etiqueta = (p) =>
    p.ajuste === 'agregado' ? '<span class="permisos-usuario__marca permisos-usuario__marca--agregado">Agregado</span>'
      : p.ajuste === 'quitado' ? '<span class="permisos-usuario__marca permisos-usuario__marca--quitado">Quitado</span>'
        : p.delRol ? '<span class="permisos-usuario__marca">Por su rol</span>' : '';
  $('#permisos-de-usuario').innerHTML = `
    <form class="permisos-usuario__ficha" id="form-permisos-usuario" data-usuario="${u.id}">
      <div class="fila entre"><div><b>${esc(u.nombre)}</b> <span class="tenue pequeno">${esc(u.correo)}</span><div class="pequeno">Rol: <b>${esc(u.rol)}</b></div></div>
        ${bloqueado ? '' : '<button class="boton violeta pequeno">Guardar permisos</button>'}</div>
      ${bloqueado ? '<div class="aviso alerta pequeno">Un Administrador siempre tiene todos los permisos.</div>' : ''}
      <div class="aviso error oculto" id="err-permisos-usuario"></div>
      <div class="permisos-usuario__lista">${d.permisos
        .map((p) => `<label class="permisos-usuario__permiso"><input type="checkbox" name="permisos" value="${esc(p.codigo)}" ${p.efectivo ? 'checked' : ''} ${bloqueado ? 'disabled' : ''}>
          <span>${esc(p.nombre)}<small class="permisos-usuario__modulo">${esc(p.modulo)} · ${esc(p.codigo)}</small></span>${etiqueta(p)}</label>`)
        .join('')}</div>
    </form>`;
  $('#form-permisos-usuario')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      const r = await actualizar(`/admin/permisos-usuarios/${f.dataset.usuario}`, { permisos: [...f.querySelectorAll('[name=permisos]:checked')].map((c) => c.value) }, 'PUT');
      aviso(`Permisos guardados (${r.agregados} agregado(s), ${r.quitados} quitado(s) respecto a su rol)`);
      verPermisosDe(f.dataset.usuario);
    } catch (er) {
      const el = $('#err-permisos-usuario');
      el.textContent = er.message;
      el.classList.remove('oculto');
    }
  });
}

// Bandeja del técnico: armados enviados o en revisión
async function revisiones() {
  const lista = await api('/revisiones');
  if (!lista.length) return '<div class="vacio">No hay armados esperando revisión.</div>';
  return `<div class="tabla-envoltura"><table class="tabla">
    <thead><tr><th>Armado</th><th>Usuario</th><th class="der">Total</th><th>Estado</th><th>Revisor</th><th></th></tr></thead>
    <tbody>${lista
      .map((a) => `<tr><td><b>${esc(a.nombre)}</b><div class="pequeno tenue">${a.piezas} pieza(s) · ${hace(a.fechaEstado)}</div></td>
        <td>${esc(a.dueno ?? '')}</td><td class="der">${dinero(a.precioTotal)}</td>
        <td><span class="estado-armado estado-armado--${a.estado}">${esc(a.nombreEstado)}</span></td>
        <td class="pequeno">${a.revisor ? esc(a.revisor) + (a.esMio ? ' (tú)' : '') : '—'}</td>
        <td class="der"><a class="boton pequeno" href="/armado.html?id=${a.id}">${a.estado === 'enviado' ? 'Revisar' : 'Abrir'}</a></td></tr>`)
      .join('')}</tbody></table></div>`;
}

// ---- Componentes: CRUD de todas las categorías salvo procesadores ----
let catalogoCampos = null;
let filtroCategoria = '';
const cargarCampos = async () => (catalogoCampos ??= await api('/admin/catalogo/campos'));

async function componentes() {
  const { categorias, campos } = await cargarCampos();
  const lista = await api(`/admin/catalogo${filtroCategoria ? `?categoria=${filtroCategoria}` : ''}`);
  const resumenTecnico = (c) =>
    (campos[c.categoria.codigo] ?? []).map((f) => `<span class="datos-tecnicos__dato">${esc(f.etiqueta.split(' (')[0])}: <b>${esc(String(c.tecnicos[f.campo] ?? '—'))}</b></span>`).join('');
  return `
    <div class="fila entre" style="margin-bottom:12px">
      <select id="filtro-categoria" style="width:auto">
        <option value="">Todas las categorías</option>
        ${categorias.map((c) => `<option value="${c.codigo}" ${c.codigo === filtroCategoria ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('')}
      </select>
      <button class="boton violeta" data-componente-nuevo>${icono('mas', 16)} Nuevo componente</button>
    </div>
    <p class="tenue pequeno" style="margin-bottom:12px">${lista.length} componente(s). Los procesadores están en su propia sección.</p>
    <div class="tabla-envoltura"><table class="tabla">
      <thead><tr><th>Componente</th><th>Categoría</th><th class="der">Precio ref.</th><th>Datos técnicos</th><th></th></tr></thead>
      <tbody>${lista
        .map((c) => `<tr><td><b>${esc(c.marca)} ${esc(c.nombre)}</b><div class="pequeno tenue">${c.consumoW} W · puntaje ${c.puntajeRendimiento}</div></td>
          <td>${esc(c.categoria.nombre)}</td><td class="der">${dinero(c.precio)}</td>
          <td><div class="datos-tecnicos">${resumenTecnico(c) || '<span class="tenue pequeno">No aplica</span>'}</div></td>
          <td class="der" style="white-space:nowrap"><button class="enlace" data-componente-editar="${c.id}">Editar</button> · <button class="enlace peligro" data-componente-borrar="${c.id}">Eliminar</button></td></tr>`)
        .join('')}</tbody></table></div>`;
}

// Campo técnico según su tipo: número, opción única (desplegable) u opciones múltiples (casillas)
function campoTecnico(f, valor, zocalos) {
  const opciones = f.tipo === 'zocalo' || f.tipo === 'zocalos' ? zocalos : f.opciones ?? [];
  if (f.tipo === 'numero') {
    return `<label class="campo"><span>${esc(f.etiqueta)}</span><input type="number" data-tecnico="${f.campo}" min="${f.min}" max="${f.max}" step="1" required value="${valor ?? ''}"></label>`;
  }
  if (f.tipo === 'opcion' || f.tipo === 'zocalo') {
    return `<label class="campo"><span>${esc(f.etiqueta)}</span><select data-tecnico="${f.campo}" required><option value="">Elige…</option>
      ${opciones.map((o) => `<option ${o === valor ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
  }
  const marcados = String(valor ?? '').split(',');
  return `<div class="campo"><span>${esc(f.etiqueta)}</span><div class="fila" style="flex-wrap:wrap;gap:12px">
    ${opciones.map((o) => `<label class="casilla"><input type="checkbox" data-tecnico-multiple="${f.campo}" value="${esc(o)}" ${marcados.includes(o) ? 'checked' : ''}> ${esc(o)}</label>`).join('')}</div></div>`;
}

// Formulario de componente. La categoría es un desplegable (llave foránea) y al cambiarla
// se dibujan solo los campos técnicos de esa categoría.
async function formularioComponente(c = null) {
  const { categorias, campos, zocalos } = await cargarCampos();
  const m = modal({
    titulo: c ? `Editar ${c.marca} ${c.nombre}` : 'Nuevo componente',
    ancho: 640,
    contenido: `<form class="formulario" id="form-componente">
      <div class="aviso error oculto" id="err-componente"></div>
      <label class="campo"><span>Categoría</span><select name="categoriaId" required>
        <option value="">Elige una categoría…</option>
        ${categorias.map((k) => `<option value="${k.id}" data-codigo="${k.codigo}" ${c?.categoria.id === k.id ? 'selected' : ''}>${esc(k.nombre)}</option>`).join('')}
      </select></label>
      <div class="dos-campos">
        <label class="campo"><span>Marca</span><input name="marca" required maxlength="40" value="${esc(c?.marca ?? '')}"></label>
        <label class="campo"><span>Modelo</span><input name="nombre" required minlength="2" maxlength="80" value="${esc(c?.nombre ?? '')}"></label>
      </div>
      <div class="dos-campos">
        <label class="campo"><span>Precio de referencia ($)</span><input name="precio" type="number" step="0.01" min="0.01" max="100000" required value="${c?.precio ?? ''}"></label>
        <label class="campo"><span>Consumo (W)</span><input name="consumoW" type="number" step="1" min="0" max="2000" required value="${c?.consumoW ?? 0}"></label>
      </div>
      <div class="dos-campos">
        <label class="campo"><span>Puntaje de rendimiento (0 a 100)</span><input name="puntajeRendimiento" type="number" step="1" min="0" max="100" required value="${c?.puntajeRendimiento ?? 0}"></label>
        <label class="campo"><span>Texto para buscar en tiendas</span><input name="busqueda" maxlength="80" placeholder="Opcional" value="${esc(c?.busqueda ?? '')}"></label>
      </div>
      <fieldset class="campos-tecnicos" id="campos-tecnicos"></fieldset>
      <button class="boton violeta">${c ? 'Guardar cambios' : 'Crear componente'}</button>
    </form>`,
  });
  const form = m.cuerpo.querySelector('form');
  const pintarTecnicos = () => {
    const codigo = form.categoriaId.selectedOptions[0]?.dataset.codigo;
    const lista = campos[codigo] ?? [];
    $('#campos-tecnicos').innerHTML = !codigo
      ? '<p class="tenue pequeno">Elige la categoría para ver sus datos técnicos.</p>'
      : lista.length
        ? `<legend class="campos-tecnicos__titulo">Datos técnicos de compatibilidad</legend>${lista.map((f) => campoTecnico(f, c?.categoria.codigo === codigo ? c.tecnicos[f.campo] : null, zocalos)).join('')}`
        : '<p class="tenue pequeno">Esta categoría no usa datos técnicos en las reglas de compatibilidad.</p>';
  };
  form.categoriaId.addEventListener('change', pintarTecnicos);
  pintarTecnicos();
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tecnicos = {};
    form.querySelectorAll('[data-tecnico]').forEach((el) => (tecnicos[el.dataset.tecnico] = el.type === 'number' ? Number(el.value) : el.value));
    form.querySelectorAll('[data-tecnico-multiple]').forEach((el) => {
      tecnicos[el.dataset.tecnicoMultiple] ??= [];
      if (el.checked) tecnicos[el.dataset.tecnicoMultiple].push(el.value);
    });
    const cuerpo = {
      categoriaId: Number(form.categoriaId.value), marca: form.marca.value.trim(), nombre: form.nombre.value.trim(),
      precio: Number(form.precio.value), consumoW: Number(form.consumoW.value), puntajeRendimiento: Number(form.puntajeRendimiento.value),
      busqueda: form.busqueda.value.trim(), tecnicos,
    };
    try {
      if (c) await actualizar(`/admin/catalogo/${c.id}`, cuerpo, 'PUT');
      else await enviar('/admin/catalogo', cuerpo);
      m.cerrar();
      aviso(c ? 'Componente actualizado' : 'Componente creado');
      mostrar('componentes');
    } catch (er) {
      const el = m.cuerpo.querySelector('#err-componente');
      el.textContent = er.message;
      el.classList.remove('oculto');
    }
  });
}

// Crear un rol: el código y el nombre se validan otra vez en el servidor
async function formularioRol() {
  const d = await api('/admin/roles');
  const m = modal({
    titulo: 'Nuevo rol',
    ancho: 560,
    contenido: `<form class="formulario" id="form-rol">
      <div class="aviso error oculto" id="err-rol"></div>
      <div class="dos-campos">
        <label class="campo"><span>Código</span><input name="codigo" required pattern="[a-z][a-z_]{2,29}" placeholder="vendedor"></label>
        <label class="campo"><span>Nombre</span><input name="nombre" required minlength="3" maxlength="40" placeholder="Vendedor"></label>
      </div>
      <label class="campo"><span>Descripción</span><input name="descripcion" maxlength="160"></label>
      <div class="campo"><span>Permisos</span>
        <div class="apilado">${d.permisos.map((p) => `<label class="casilla"><input type="checkbox" name="permisos" value="${esc(p.codigo)}"> ${esc(p.nombre)}</label>`).join('')}</div></div>
      <button class="boton violeta">Crear rol</button>
    </form>`,
  });
  m.cuerpo.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      await enviar('/admin/roles', {
        codigo: f.codigo.value.trim(),
        nombre: f.nombre.value.trim(),
        descripcion: f.descripcion.value.trim(),
        permisos: [...f.querySelectorAll('[name=permisos]:checked')].map((c) => c.value),
      });
      m.cerrar();
      aviso('Rol creado');
      mostrar('roles');
    } catch (er) {
      const el = m.cuerpo.querySelector('#err-rol');
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
  // Si la sección no existe o el rol no tiene permiso, se abre la primera permitida
  actual = SECCIONES[clave] && puede(clave) ? clave : Object.keys(SECCIONES).find(puede);
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
  if (t.closest('[data-rol-nuevo]')) return formularioRol();
  if (t.closest('[data-componente-nuevo]')) return formularioComponente();
  const ce = t.closest('[data-componente-editar]');
  if (ce) {
    const lista = await api(`/admin/catalogo${filtroCategoria ? `?categoria=${filtroCategoria}` : ''}`);
    return formularioComponente(lista.find((x) => x.id === Number(ce.dataset.componenteEditar)));
  }
  const cb = t.closest('[data-componente-borrar]');
  if (cb) {
    if (!confirm('¿Eliminar este componente? También se borran sus precios y reseñas.')) return;
    try {
      await borrar(`/admin/catalogo/${cb.dataset.componenteBorrar}`);
      aviso('Componente eliminado');
      mostrar('componentes');
    } catch (er) {
      aviso(er.message, 'error');
    }
    return;
  }
  const vp = t.closest('[data-ver-permisos]');
  if (vp) return verPermisosDe(vp.dataset.verPermisos).catch((er) => aviso(er.message, 'error'));
  const br = t.closest('[data-rol-borrar]');
  if (br) {
    if (!confirm('¿Eliminar este rol?')) return;
    try {
      await borrar(`/admin/roles/${br.dataset.rolBorrar}`);
      aviso('Rol eliminado');
    } catch (er) {
      aviso(er.message, 'error');
    }
    return mostrar('roles');
  }
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
      await actualizar(`/admin/usuarios/${t.dataset.rol}`, { rolId: Number(t.value) });
      aviso('Rol actualizado');
    } else if (t.id === 'filtro-categoria') {
      filtroCategoria = t.value;
      return mostrar('componentes');
    } else if (t.dataset.permisoRol) {
      // Al marcar o desmarcar una casilla se envía la lista completa de permisos de ese rol
      const marcadas = [...document.querySelectorAll(`[data-permiso-rol="${t.dataset.permisoRol}"]:checked`)].map((c) => c.value);
      try {
        await actualizar(`/admin/roles/${t.dataset.permisoRol}/permisos`, { permisos: marcadas }, 'PUT');
        aviso('Permisos actualizados');
      } catch (er) {
        t.checked = !t.checked;
        throw er;
      }
    } else if (t.dataset.activo) {
      await actualizar(`/admin/usuarios/${t.dataset.activo}`, { activo: t.checked });
      aviso(t.checked ? 'Cuenta activada' : 'Cuenta desactivada');
    }
  } catch (er) {
    aviso(er.message, 'error');
  }
});

document.addEventListener('input', (e) => {
  if (e.target.id !== 'buscar-usuario') return;
  clearTimeout(e.target._espera);
  e.target._espera = setTimeout(() => buscarUsuariosPermisos(e.target.value.trim()).catch((er) => aviso(er.message, 'error')), 250);
});

montar('').then((u) => {
  if (!u) return (location.href = `/ingresar.html?volver=${encodeURIComponent('/admin.html')}`);
  if (!u.esAdmin) {
    contenido().innerHTML = '<div class="aviso error">Tu rol no tiene acceso al panel de administración.</div>';
    return;
  }
  permisos = u.permisos ?? [];
  $('#menu').innerHTML = Object.entries(SECCIONES)
    .filter(([k]) => puede(k))
    .map(([k, [t, i]]) => `<button data-ir="${k}">${icono(i, 17)} ${t}</button>`)
    .join('');
  mostrar(location.hash.slice(1));
});
