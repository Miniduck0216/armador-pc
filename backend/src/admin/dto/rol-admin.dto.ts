import { Transform } from 'class-transformer';
import { ArrayUnique, IsArray, IsOptional, IsString, Length, Matches } from 'class-validator';

// Rol nuevo creado desde el panel. El código se valida en el servidor porque
// identifica al rol en todo el sistema (solo minúsculas y guiones bajos).
export class RolAdminDto {
  @Transform(({ value }) => String(value ?? '').trim().toLowerCase())
  @Matches(/^[a-z][a-z_]{2,29}$/, { message: 'El código debe tener de 3 a 30 letras minúsculas o guiones bajos' })
  codigo: string;

  @Transform(({ value }) => String(value ?? '').trim())
  @IsString() @Length(3, 40, { message: 'El nombre debe tener entre 3 y 40 caracteres' })
  nombre: string;

  @IsOptional() @IsString() @Length(0, 160, { message: 'La descripción es demasiado larga' })
  descripcion?: string;

  @IsArray({ message: 'Los permisos deben ser una lista' })
  @ArrayUnique()
  @IsString({ each: true })
  permisos: string[];
}

// Cambio de permisos (y opcionalmente nombre) de un rol existente
export class RolPermisosDto {
  @IsArray({ message: 'Los permisos deben ser una lista' })
  @ArrayUnique()
  @IsString({ each: true })
  permisos: string[];
}

