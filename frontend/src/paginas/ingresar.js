import { montar } from '../js/layout.js';
import { enviar } from '../js/api.js';
import { $ } from '../js/util.js';
import { destino, mostrarError, prepararAcceso } from './acceso.js';

montar('').then((u) => u && location.replace(destino()));
prepararAcceso();
$('#ir-registro').href = `/registro.html${location.search}`;

$('#formulario').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const boton = f.querySelector('button');
  mostrarError('');
  if (!f.correo.value || !f.contrasena.value) return mostrarError('Escribe tu correo y contraseña.');
  boton.disabled = true;
  try {
    await enviar('/auth/ingresar', { correo: f.correo.value.trim(), contrasena: f.contrasena.value });
    location.href = destino();
  } catch (er) {
    mostrarError(er.message);
    boton.disabled = false;
  }
});
