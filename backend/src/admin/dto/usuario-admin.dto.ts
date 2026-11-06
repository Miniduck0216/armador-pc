import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsString, Length, Matches, MaxLength } from 'class-validator';

// Cuenta creada por el administrador. Correo, contraseña y rol son datos sensibles:
// se validan aquí, en el servidor, antes de cifrar la contraseña y guardar el usuario.
export class UsuarioAdminDto {
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString() @Length(2, 60, { message: 'El nombre debe tener entre 2 y 60 caracteres' })
  nombre: string;

  @Transform(({ value }) => String(value ?? '').trim().toLowerCase())
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  @MaxLength(120, { message: 'El correo es demasiado largo' })
  correo: string;

  // Al menos 8 caracteres con letras y números. bcrypt solo usa los primeros 72 bytes, por eso el máximo.
  @IsString()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/, { message: 'La contraseña debe tener entre 8 y 72 caracteres, con letras y números' })
  contrasena: string;

  @IsIn(['admin', 'usuario'], { message: 'El rol debe ser Administrador o Usuario' })
  rol: 'admin' | 'usuario';
}
