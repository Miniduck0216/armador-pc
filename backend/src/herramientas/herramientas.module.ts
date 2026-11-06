import { Body, Controller, HttpCode, Injectable, Module, Post } from '@nestjs/common';
import { ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ComponentesModule } from '../componentes/componentes.module';
import { ComponentesService } from '../componentes/componentes.service';
import { PreciosModule } from '../precios/precios.module';
import { PreciosService } from '../precios/precios.service';
import { validacionApi } from '../comun/validacion-api.pipe';
import { Componente } from '../componentes/componente.entity';

// ---------------------------------------------------------------------------
// Datos de entrada
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Lógica de las calculadoras
// ---------------------------------------------------------------------------
@Injectable()
export class HerramientasService {
  constructor(
    private readonly componentes: ComponentesService,
    private readonly precios: PreciosService,
  ) {}

  private async pieza(id?: number): Promise<Componente | null> {
    if (!id) return null;
    try {
      return await this.componentes.obtener(id);
    } catch {
      return null;
    }
  }

  // Fuentes o disipadores del catálogo que cumplen, con su mejor precio
  private async recomendar(codigo: string, cumple: (c: Componente) => boolean, orden: (a: Componente, b: Componente) => number) {
    const lista = (await this.componentes.listar(codigo)).filter(cumple).sort(orden).slice(0, 4);
    const precios = await this.precios.mejoresPrecios(lista.map((c) => c.id));
    return lista.map((c) => ({
      id: c.id,
      nombre: `${c.marca} ${c.nombre}`,
      precio: precios.get(c.id)?.mejor ?? c.precio,
      tieneOfertas: !!precios.get(c.id)?.mejor,
      imagen: c.imagenTienda || c.imagenUrl,
      dato: c.potenciaW ? `${c.potenciaW} W` : c.capacidadTermicaW ? `${c.capacidadTermicaW} W de disipación` : '',
      atributos: c.atributos,
    }));
  }

  async fuente(d: CalculoFuenteDto) {
    const cpu = await this.pieza(d.cpuId);
    const gpu = await this.pieza(d.gpuId);
    const cpuBase = cpu?.consumoW ?? d.cpuW ?? 65;
    // Los procesadores superan su TDP en ráfagas (sobre todo los Intel desbloqueados)
    const factorCpu = cpu?.marca === 'Intel' && /k\b|kf\b/i.test(cpu.nombre) ? 1.6 : 1.25;
    const cpuW = Math.round(cpuBase * factorCpu * (d.overclock ? 1.25 : 1));
    const gpuW = Math.round((gpu?.consumoW ?? d.gpuW ?? 0) * (d.overclock ? 1.1 : 1));

    const desglose = [
      { parte: cpu ? `Procesador (${cpu.marca} ${cpu.nombre})` : 'Procesador', vatios: cpuW },
      { parte: gpu ? `Tarjeta gráfica (${gpu.nombre})` : 'Tarjeta gráfica', vatios: gpuW },
      { parte: 'Placa madre', vatios: 50 },
      { parte: `Memoria RAM (${d.modulosRam ?? 2} módulos)`, vatios: (d.modulosRam ?? 2) * 5 },
      { parte: `Almacenamiento (${d.discos ?? 1})`, vatios: (d.discos ?? 1) * 7 },
      { parte: `Ventiladores (${d.ventiladores ?? 3})`, vatios: (d.ventiladores ?? 3) * 3 },
      { parte: 'Bomba de refrigeración líquida', vatios: d.refrigeracionLiquida ? 8 : 0 },
      { parte: 'USB y periféricos', vatios: 15 },
    ].filter((x) => x.vatios > 0);

    const consumo = desglose.reduce((t, x) => t + x.vatios, 0);
    // Se deja un 30 % de margen: la fuente trabaja más fresca, más eficiente y soporta picos de la GPU
    const recomendada = Math.max(450, Math.ceil((consumo * 1.3) / 50) * 50);
    const fuentes = await this.recomendar(
      'FUENTE',
      (c) => (c.potenciaW ?? 0) >= recomendada,
      (a, b) => a.potenciaW - b.potenciaW || a.precio - b.precio,
    );
    return {
      consumo,
      recomendada,
      margen: 30,
      desglose,
      consejo:
        recomendada >= 850
          ? 'Para este consumo conviene una fuente 80 Plus Gold con norma ATX 3.0 y conector 12V-2x6 para la tarjeta gráfica.'
          : 'Una fuente 80 Plus Bronze o Gold de una marca conocida es suficiente. Evita fuentes genéricas sin certificación.',
      fuentes,
    };
  }

  async refrigeracion(d: CalculoRefrigeracionDto) {
    const cpu = await this.pieza(d.cpuId);
    const tdp = cpu?.consumoW ?? d.tdp ?? 65;
    const factores = {
      uso: { oficina: 0.7, juegos: 1, render: 1.3 }[d.uso ?? 'juegos'],
      intelK: cpu?.marca === 'Intel' && /k\b|kf\b/i.test(cpu.nombre) ? 1.5 : 1,
      overclock: d.overclock ? 1.25 : 1,
      ambiente: (d.temperatura ?? 25) > 28 ? 1.1 : 1,
      caja: { compacta: 1.15, media: 1, grande: 0.95 }[d.caja ?? 'media'],
    };
    const calor = Math.round(tdp * factores.uso * factores.intelK * factores.overclock * factores.ambiente * factores.caja);

    const tipo =
      calor <= 95 ? { nombre: 'Disipador básico o de torre pequeña', detalle: 'El disipador que incluye el procesador o una torre de 92-120 mm alcanza.' }
      : calor <= 180 ? { nombre: 'Torre de aire con un ventilador de 120 mm', detalle: 'Buena relación precio y silencio para la mayoría de equipos de juego.' }
      : calor <= 240 ? { nombre: 'Doble torre de aire o líquida de 240 mm', detalle: 'Necesitas más superficie para que el procesador no baje su frecuencia.' }
      : calor <= 300 ? { nombre: 'Líquida de 280-360 mm o doble torre premium', detalle: 'Procesadores de gama alta con cargas largas o con overclock.' }
      : { nombre: 'Líquida de 360 mm', detalle: 'Calor muy alto: solo una refrigeración líquida grande lo mantiene estable.' };

    const disipadores = await this.recomendar(
      'REFRIG',
      (c) => (c.capacidadTermicaW ?? 0) >= calor && (!cpu?.zocalo || (c.zocalosSoportados ?? '').split(',').includes(cpu.zocalo)),
      (a, b) => a.precio - b.precio,
    );
    return {
      procesador: cpu ? `${cpu.marca} ${cpu.nombre}` : null,
      tdp,
      calor,
      factores,
      tipo,
      altura: d.caja === 'compacta' ? 'En cajas compactas revisa la altura máxima del disipador (suele ser menos de 155 mm).' : null,
      disipadores,
    };
  }
}

@ApiTags('Herramientas')
@Controller('api/herramientas')
export class HerramientasController {
  constructor(private readonly herramientas: HerramientasService) {}

  @Post('fuente')
  @HttpCode(200)
  @ApiOperation({ summary: 'Calculadora de fuente de poder: consumo estimado y potencia recomendada' })
  fuente(@Body(validacionApi) dto: CalculoFuenteDto) {
    return this.herramientas.fuente(dto);
  }

  @Post('refrigeracion')
  @HttpCode(200)
  @ApiOperation({ summary: 'Calculadora de refrigeración: calor a disipar y tipo de disipador recomendado' })
  refrigeracion(@Body(validacionApi) dto: CalculoRefrigeracionDto) {
    return this.herramientas.refrigeracion(dto);
  }
}

@Module({
  imports: [ComponentesModule, PreciosModule],
  providers: [HerramientasService],
  controllers: [HerramientasController],
})
export class HerramientasModule {}
