import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';

// Las casillas de un formulario HTML llegan como "on" cuando están marcadas
const casilla = () => Transform(({ value }) => value === 'on' || value === 'true' || value === true);

// Datos que el administrador envía al crear o editar un procesador
export class ProcesadorDto {
  @IsString() @Length(2, 60, { message: 'El nombre debe tener entre 2 y 60 caracteres' })
  nombre: string;

  @IsIn(['AMD', 'Intel'], { message: 'La marca debe ser AMD o Intel' })
  marca: string;

  @Type(() => Number) @IsNumber({}, { message: 'El precio debe ser un número' }) @Min(1) @Max(10000)
  precio: number;

  @IsString() @Length(2, 20, { message: 'Indica el zócalo (por ejemplo AM5)' })
  zocalo: string;

  @Type(() => Number) @IsInt({ message: 'Los núcleos deben ser un número entero' }) @Min(1) @Max(256)
  nucleos: number;

  @Type(() => Number) @IsInt({ message: 'Los hilos deben ser un número entero' }) @Min(1) @Max(512)
  hilos: number;

  @Type(() => Number) @IsNumber() @Min(0.5) @Max(10)
  frecuenciaBase: number;

  @Type(() => Number) @IsNumber() @Min(0.5) @Max(10)
  frecuenciaTurbo: number;

  @Type(() => Number) @IsInt() @Min(1) @Max(1024)
  cacheL3: number;

  @Type(() => Number) @IsInt() @Min(5) @Max(500)
  tdp: number;

  @Type(() => Number) @IsInt() @Min(1) @Max(100)
  litografia: number;

  @Type(() => Number) @IsInt() @Min(2000) @Max(2100)
  anioLanzamiento: number;

  @casilla() @IsBoolean()
  graficosIntegrados: boolean;

  @IsOptional() @IsString()
  nombreGraficos?: string;

  @IsIn(['DDR4', 'DDR5', 'DDR4/DDR5'], { message: 'Elige un tipo de memoria válido' })
  memoriaSoportada: string;

  @Type(() => Number) @IsInt() @Min(1000) @Max(20000)
  velocidadMemoriaMax: number;

  @Type(() => Number) @IsIn([3, 4, 5, 6], { message: 'La versión de PCIe debe ser 3, 4, 5 o 6' })
  versionPcie: number;

  @casilla() @IsBoolean()
  desbloqueado: boolean;

  @Type(() => Number) @IsInt() @Min(1) @Max(10000)
  cinebenchMono: number;

  @Type(() => Number) @IsInt() @Min(1) @Max(300000)
  cinebenchMulti: number;
}

// Filtros que llegan por la dirección: /api/procesadores?marca=AMD&orden=precio_asc
export class FiltrosProcesadorDto {
  @IsOptional() @IsString() buscar?: string;
  @IsOptional() @IsString() marca?: string; // una o varias separadas por coma
  @IsOptional() @IsString() zocalo?: string;
  @IsOptional() @IsString() memoria?: string;
  @IsOptional() @Type(() => Number) @IsNumber() nucleosMin?: number;
  @IsOptional() @Type(() => Number) @IsNumber() precioMin?: number;
  @IsOptional() @Type(() => Number) @IsNumber() precioMax?: number;
  @IsOptional() @Type(() => Number) @IsNumber() anioMin?: number;
  @IsOptional() @IsIn(['si', '']) graficos?: string;
  @IsOptional() @IsIn(['si', '']) desbloqueado?: string;
  @IsOptional()
  @IsIn(['puntos', 'precio_asc', 'precio_desc', 'valor', 'nucleos', 'mono', 'multi', 'reciente'])
  orden?: string;
}
