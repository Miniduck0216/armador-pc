import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export const ORDENES_PRODUCTO = ['relevancia', 'precio_asc', 'precio_desc', 'rendimiento', 'bajada', 'nombre'] as const;

// Filtros del catálogo: /api/componentes?categoria=GPU&marca=AMD,NVIDIA&precioMax=600&orden=precio_asc
export class FiltrosProductoDto {
  @ApiPropertyOptional({ example: 'GPU', description: 'Código de categoría' })
  @IsOptional() @IsString()
  categoria?: string;

  @ApiPropertyOptional({ example: 'rtx 50' })
  @IsOptional() @IsString()
  buscar?: string;

  @ApiPropertyOptional({ example: 'AMD,NVIDIA', description: 'Una o varias marcas separadas por coma' })
  @IsOptional() @IsString()
  marca?: string;

  @ApiPropertyOptional({ example: 'Media,Alta', description: 'Gamas: Básica, Media, Alta, Entusiasta' })
  @IsOptional() @IsString()
  gama?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  precioMin?: number;

  @ApiPropertyOptional({ example: 800 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  precioMax?: number;

  @ApiPropertyOptional({ description: 'Solo productos con stock en alguna tienda' })
  @IsOptional() @Transform(({ value }) => value === true || value === 'true' || value === 'si') @IsBoolean()
  enStock?: boolean;

  @ApiPropertyOptional({ enum: ORDENES_PRODUCTO, default: 'relevancia' })
  @IsOptional() @IsIn(ORDENES_PRODUCTO)
  orden?: (typeof ORDENES_PRODUCTO)[number];

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  pagina?: number;

  @ApiPropertyOptional({ default: 24, maximum: 60 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(60)
  limite?: number;
}
