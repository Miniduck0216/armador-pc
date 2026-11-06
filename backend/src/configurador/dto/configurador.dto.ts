import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ResumenDto {
  @ApiProperty({ example: [1, 7, 20], description: 'Ids de las piezas elegidas (una por categoría)' })
  @IsArray() @ArrayMaxSize(20) @Type(() => Number) @IsInt({ each: true })
  piezas: number[];

  @ApiPropertyOptional({ enum: ['juegos', 'trabajo'], default: 'juegos' })
  @IsOptional() @IsIn(['juegos', 'trabajo'])
  uso?: 'juegos' | 'trabajo';
}

export class OpcionesDto {
  @ApiProperty({ example: 'GPU', description: 'Código de la categoría' })
  @IsString()
  categoria: string;

  @ApiPropertyOptional({ example: '1,7', description: 'Ids ya elegidos, separados por coma' })
  @IsOptional() @IsString()
  piezas?: string;

  @ApiPropertyOptional({ example: 'rtx' })
  @IsOptional() @IsString()
  buscar?: string;

  @ApiPropertyOptional({ enum: ['precio', 'precio_desc', 'rendimiento', 'nombre'], default: 'precio' })
  @IsOptional() @IsIn(['precio', 'precio_desc', 'rendimiento', 'nombre'])
  orden?: string;
}

export class SugerirDto {
  @ApiPropertyOptional({ description: 'Arma un equipo sin tarjeta gráfica (procesador con gráficos integrados)' })
  @IsOptional() @Transform(({ value }) => value === true || value === 'true' || value === 'si')
  sinGrafica?: boolean;

  @ApiProperty({ example: 1200, description: 'Presupuesto en dólares' })
  @Type(() => Number) @IsInt() @Min(100) @Max(20000)
  presupuesto: number;

  @ApiPropertyOptional({ enum: ['juegos', 'trabajo'], default: 'juegos' })
  @IsOptional() @IsIn(['juegos', 'trabajo'])
  uso?: 'juegos' | 'trabajo';
}
