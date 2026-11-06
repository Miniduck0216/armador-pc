import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsUrl, Max, MaxLength, Min } from 'class-validator';

// Precio cargado a mano por el administrador (una oferta por componente y tienda).
// Se valida en el servidor aunque el formulario también valide en el navegador.
export class OfertaAdminDto {
  @Type(() => Number) @IsInt({ message: 'Elige un componente válido' }) @Min(1)
  componenteId: number;

  @Type(() => Number) @IsInt({ message: 'Elige una tienda válida' }) @Min(1)
  tiendaId: number;

  @Type(() => Number) @IsNumber({}, { message: 'El precio debe ser un número' }) @Min(0.01, { message: 'El precio debe ser mayor a 0' }) @Max(100000, { message: 'El precio supera el límite permitido' })
  precio: number;

  @Transform(({ value }) => value === true || value === 'true' || value === 'on')
  @IsBoolean()
  enStock: boolean;

  // Solo enlaces http o https, para que la tienda no pueda apuntar a una dirección peligrosa
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: true }, { message: 'El enlace debe empezar con https:// y ser una dirección válida' })
  @MaxLength(500, { message: 'El enlace es demasiado largo' })
  url: string;
}
