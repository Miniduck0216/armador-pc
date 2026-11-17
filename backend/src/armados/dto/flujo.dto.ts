import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

// Acción sobre un armado. El comentario se limpia y se limita en el servidor;
// si la acción exige motivo (devolver, rechazar), el servicio comprueba que venga.
export class AccionArmadoDto {
  @IsIn(['enviar', 'tomar', 'aprobar', 'devolver', 'rechazar'], { message: 'Acción no válida' })
  accion: 'enviar' | 'tomar' | 'aprobar' | 'devolver' | 'rechazar';

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(300, { message: 'El comentario puede tener hasta 300 caracteres' })
  comentario?: string;
}
