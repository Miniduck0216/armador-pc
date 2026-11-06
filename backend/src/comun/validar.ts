import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

// Valida los datos de un formulario contra una clase DTO y devuelve
// la instancia lista para usar junto con los mensajes de error en español.
export async function validarFormulario<T extends object>(clase: new () => T, datos: any) {
  const dto = plainToInstance(clase, datos ?? {});
  const resultado = await validate(dto, { whitelist: true });
  // Los mensajes por defecto de class-validator están en inglés (empiezan con el nombre
  // del campo en minúscula); se reemplazan por un mensaje genérico en español.
  const errores = resultado.flatMap((e) =>
    Object.values(e.constraints ?? {}).map((m) => (/^[a-z]/.test(m) ? `El valor de "${e.property}" no es válido` : m)),
  );
  return { dto, errores };
}

// Evita redirecciones a sitios externos: solo se permiten rutas internas
export function rutaSegura(ruta: string | undefined, porDefecto = '/') {
  if (!ruta || !ruta.startsWith('/') || ruta.startsWith('//') || ruta.includes('\\')) return porDefecto;
  return ruta;
}
