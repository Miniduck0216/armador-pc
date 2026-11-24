import { montar } from '../js/layout.js';
import { enviar } from '../js/api.js';
import { $ } from '../js/util.js';
import { botonCargando, destino, mostrarError, prepararAcceso, salirConExito } from './acceso.js';

montar('').then((u) => u && location.replace(destino()));
prepararAcceso();
$('#ir-ingresar').href = `/ingresar.html${location.search}`;

// Indicador de fuerza de la contraseña
const f = $('#formulario');
f.contrasena.addEventListener('input', () => {
  const c = f.contrasena.value;
  const puntos = [c.length >= 8, /[a-z]/i.test(c) && /\d/.test(c), c.length >= 12, /[^a-z0-9]/i.test(c), /[a-z]/.test(c) && /[A-Z]/.test(c)].filter(Boolean).length;
  const niveles = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Muy buena', 'Excelente'];
  // El ancho y el color de cada nivel están en Sass (formulario__fuerza-relleno--0 … --5)
  $('#fuerza').className = `formulario__fuerza-relleno formulario__fuerza-relleno--${puntos}`;
  $('#fuerza-texto').textContent = c ? `Seguridad: ${niveles[puntos]}` : 'Mínimo 8 caracteres, con letras y números.';
});

f.addEventListener('submit', async (e) => {
  e.preventDefault();
  mostrarError('');
  const datos = Object.fromEntries(new FormData(f));
  if (datos.nombre.trim().length < 2) return mostrarError('Escribe tu nombre.');
  if (datos.contrasena.length < 8 || !/[a-z]/i.test(datos.contrasena) || !/\d/.test(datos.contrasena)) return mostrarError('La contraseña debe tener al menos 8 caracteres, con letras y números.');
  if (datos.contrasena !== datos.confirmar) return mostrarError('Las contraseñas no coinciden.');
  const boton = f.querySelector('button');
  botonCargando(boton, true);
  try {
    await enviar('/auth/registro', { ...datos, nombre: datos.nombre.trim(), correo: datos.correo.trim() });
    salirConExito(boton, '¡Cuenta creada!', destino());
  } catch (er) {
    mostrarError(er.message);
    botonCargando(boton, false);
  }
});
