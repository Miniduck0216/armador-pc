import { montar } from '../js/layout.js';
import { enviar } from '../js/api.js';
import { $ } from '../js/util.js';
import { botonCargando, destino, mostrarError, prepararAcceso, salirConExito } from './acceso.js';

montar('').then((u) => u && location.replace(destino()));
prepararAcceso();
$('#ir-registro').href = `/registro.html${location.search}`;

$('#formulario').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const boton = f.querySelector('button');
  mostrarError('');
  if (!f.correo.value || !f.contrasena.value) return mostrarError('Escribe tu correo y contraseña.');
  botonCargando(boton, true);
  try {
    const { usuario } = await enviar('/auth/ingresar', { correo: f.correo.value.trim(), contrasena: f.contrasena.value });
    salirConExito(boton, `¡Hola, ${usuario.nombre.split(' ')[0]}!`, destino());
  } catch (er) {
    mostrarError(er.message);
    botonCargando(boton, false);
  }
});
