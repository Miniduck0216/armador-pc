import { Transform, Type } from 'class-transformer';
import { IsInt, IsNumber, IsObject, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

const limpiar = ({ value }) => (typeof value === 'string' ? value.trim() : value);

// Componente creado o editado desde el panel. Los campos comunes se validan aquí;
// los técnicos dependen de la categoría y los valida ComponentesService con campos-categoria.ts.
export class ComponenteAdminDto {
  // Llave foránea a categorias: se elige en un desplegable
  @Type(() => Number) @IsInt({ message: 'Elige una categoría válida' }) @Min(1, { message: 'Elige una categoría válida' })
  categoriaId: number;

  @Transform(limpiar) @IsString() @Length(2, 80, { message: 'El modelo debe tener entre 2 y 80 caracteres' })
  nombre: string;

  @Transform(limpiar) @IsString() @Length(1, 40, { message: 'La marca debe tener entre 1 y 40 caracteres' })
  marca: string;

  @Type(() => Number) @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0.01, { message: 'El precio debe ser mayor a 0' }) @Max(100000, { message: 'El precio supera el límite permitido' })
  precio: number;

  @Type(() => Number) @IsInt({ message: 'El consumo debe ser un número entero' })
  @Min(0, { message: 'El consumo no puede ser negativo' }) @Max(2000, { message: 'El consumo máximo es 2000 W' })
  consumoW: number;

  @Type(() => Number) @IsInt({ message: 'El puntaje debe ser un número entero' })
  @Min(0, { message: 'El puntaje va de 0 a 100' }) @Max(100, { message: 'El puntaje va de 0 a 100' })
  puntajeRendimiento: number;

  // Texto para buscar el producto en las tiendas (opcional)
  @IsOptional() @Transform(limpiar) @IsString() @MaxLength(80, { message: 'La búsqueda es demasiado larga' })
  busqueda?: string;

  // Campos técnicos: { zocalo: 'AM5', potenciaW: 750, ... }
  @IsOptional() @IsObject({ message: 'Los datos técnicos no tienen el formato correcto' })
  tecnicos?: Record<string, unknown>;
}
