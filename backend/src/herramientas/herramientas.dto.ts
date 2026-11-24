import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

// Datos de entrada de las calculadoras (se validan antes de llegar al servicio)
export class CalculoFuenteDto {
  @ApiPropertyOptional({ description: 'Id del procesador del catálogo' }) @IsOptional() @Type(() => Number) @IsInt()
  cpuId?: number;
  @ApiPropertyOptional({ description: 'O el consumo del procesador en W' }) @IsOptional() @Type(() => Number) @IsInt() @Min(10) @Max(500)
  cpuW?: number;
  @ApiPropertyOptional({ description: 'Id de la tarjeta gráfica' }) @IsOptional() @Type(() => Number) @IsInt()
  gpuId?: number;
  @ApiPropertyOptional({ description: 'O el consumo de la tarjeta gráfica en W' }) @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(800)
  gpuW?: number;
  @ApiPropertyOptional({ default: 2 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(8)
  modulosRam?: number;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(8)
  discos?: number;
  @ApiPropertyOptional({ default: 3 }) @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(12)
  ventiladores?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  refrigeracionLiquida?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  overclock?: boolean;
}

export class CalculoRefrigeracionDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt()
  cpuId?: number;
  @ApiPropertyOptional({ description: 'O el TDP del procesador en W' }) @IsOptional() @Type(() => Number) @IsInt() @Min(10) @Max(500)
  tdp?: number;
  @ApiPropertyOptional({ enum: ['oficina', 'juegos', 'render'], default: 'juegos' }) @IsOptional() @IsIn(['oficina', 'juegos', 'render'])
  uso?: 'oficina' | 'juegos' | 'render';
  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  overclock?: boolean;
  @ApiPropertyOptional({ default: 25, description: 'Temperatura del ambiente en °C' }) @IsOptional() @Type(() => Number) @IsInt() @Min(10) @Max(45)
  temperatura?: number;
  @ApiPropertyOptional({ enum: ['compacta', 'media', 'grande'], default: 'media' }) @IsOptional() @IsIn(['compacta', 'media', 'grande'])
  caja?: 'compacta' | 'media' | 'grande';
}
