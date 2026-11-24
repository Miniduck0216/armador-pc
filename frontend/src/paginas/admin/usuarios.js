// Sección "Usuarios": cuentas, su rol (llave foránea a la tabla roles) y si están activas
import { actualizar, api, enviar } from '../../js/api.js';
import { icono } from '../../js/iconos.js';
import { aviso, esc, fecha, hace, tabla } from '../../js/util.js';
import { campo, formularioModal, interruptor, opciones } from './comun.js';

let roles = [];
const listaRoles = () => roles.map((r) => [r.id, esc(r.nombre)]);

// Crear cuenta: la validación real (correo, contraseña segura, rol) la hace el servidor
function formulario(recargar) {
  formularioModal({
    titulo: 'Nuevo usuario',
    ancho: 520,
    boton: 'Crear cuenta',
    html: `
      ${campo('Nombre', '<input name="nombre" required minlength="2" maxlength="60">')}
      ${campo('Correo', '<input name="correo" type="email" required maxlength="120">')}
      ${campo('Contraseña (8 o más caracteres, con letras y números)', '<input name="contrasena" type="password" required minlength="8" maxlength="72" autocomplete="new-password">')}
      ${campo('Rol', `<select name="rolId" required><option value="">Elige un rol…</option>${opciones(listaRoles())}</select>`)}`,
    alEnviar: async (f) => {
      await enviar('/admin/usuarios', {
        nombre: f.nombre.value.trim(),
        correo: f.correo.value.trim(),
        contrasena: f.contrasena.value,
        rolId: Number(f.rolId.value),
      });
      aviso('Cuenta creada');
      recargar();
    },
  });
}

export default {
  titulo: 'Usuarios',
  icono: 'usuario',
  permiso: 'usuarios.gestionar',

  async html() {
    const [lista, rolesLista] = await Promise.all([api('/admin/usuarios'), api('/admin/roles-lista')]);
    roles = rolesLista;
    const filas = lista.map((u) => [
      `<b>${esc(u.nombre)}</b>${u.esYo ? ' <span class="insignia">Tú</span>' : ''}<small class="tabla__detalle">${esc(u.correo)}</small>`,
      `<span class="texto texto--pequeno">${fecha(u.fechaRegistro)}</span>`,
      `<span class="texto texto--pequeno">${u.ultimoIngreso ? hace(u.ultimoIngreso) : 'nunca'}</span>`,
      // El rol se elige de un desplegable: nunca se escribe a mano
      `<select class="formulario__corto" data-rol="${u.id}" ${u.esYo ? 'disabled' : ''}>${opciones(listaRoles(), u.rol?.id)}</select>`,
      interruptor(`data-activo="${u.id}" ${u.activo ? 'checked' : ''} ${u.esYo ? 'disabled' : ''}`),
    ]);
    return `
      <div class="panel__acciones"><button class="boton boton--violeta" data-nuevo>${icono('mas', 16)} Nuevo usuario</button></div>
      ${tabla(['Usuario', 'Registro', 'Último ingreso', 'Rol', 'Activo'], filas)}`;
  },

  conectar(zona, { recargar }) {
    zona.querySelector('[data-nuevo]').addEventListener('click', () => formulario(recargar));
    zona.addEventListener('change', async (e) => {
      const t = e.target;
      try {
        if (t.dataset.rol) {
          await actualizar(`/admin/usuarios/${t.dataset.rol}`, { rolId: Number(t.value) });
          aviso('Rol actualizado');
        } else if (t.dataset.activo) {
          await actualizar(`/admin/usuarios/${t.dataset.activo}`, { activo: t.checked });
          aviso(t.checked ? 'Cuenta activada' : 'Cuenta desactivada');
        }
      } catch (er) {
        aviso(er.message, 'error');
      }
    });
  },
};
