import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class IngresoDto {
  @IsEmail({}, { message: 'Escribe un correo válido' })
  correo: string;

  @IsString()
  @IsNotEmpty({ message: 'Escribe tu contraseña' })
  contrasena: string;

  @IsOptional()
  @IsString()
  volver?: string;
}

export class RegistroDto {
  @IsString()
  @Length(2, 40, { message: 'El nombre debe tener entre 2 y 40 caracteres' })
  nombre: string;

  @IsEmail({}, { message: 'Escribe un correo válido' })
  correo: string;

  @IsString()
  @Length(8, 64, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, { message: 'La contraseña debe incluir letras y números' })
  contrasena: string;

  @IsString()
  confirmar: string;
}
