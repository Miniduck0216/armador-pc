import { BadRequestException, ValidationPipe } from '@nestjs/common';

// Validación de la API con mensajes en español. Los mensajes propios (en español,
// empiezan con mayúscula) se conservan; los de class-validator en inglés se reemplazan.
export const validacionApi = new ValidationPipe({
  transform: true,
  whitelist: true,
  exceptionFactory: (errores) =>
    new BadRequestException(
      [
        ...new Set(
          errores.flatMap((e) =>
            Object.values(e.constraints ?? {}).map((m) => (/^[a-z]/.test(m) ? `El parámetro "${e.property}" no es válido` : m)),
          ),
        ),
      ],
    ),
});
