import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

// Todas las respuestas de error tienen la misma forma: { estado, mensaje }
@Catch()
export class FiltroErrores implements ExceptionFilter {
  private readonly log = new Logger('Errores');

  catch(error: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (error instanceof HttpException) {
      const respuesta = error.getResponse() as any;
      const mensaje = Array.isArray(respuesta?.message) ? respuesta.message.join('. ') : respuesta?.message ?? error.message;
      return res.status(error.getStatus()).json({ estado: error.getStatus(), mensaje });
    }
    this.log.error(error instanceof Error ? error.stack : String(error));
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ estado: 500, mensaje: 'Ocurrió un error inesperado en el servidor' });
  }
}
