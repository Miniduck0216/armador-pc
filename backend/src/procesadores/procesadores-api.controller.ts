import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { validacionApi } from '../comun/validacion-api.pipe';
import {
  BadRequestException, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards,
} from '@nestjs/common';
import { ProcesadoresService } from './procesadores.service';
import { ComparacionService } from './comparacion.service';
import { FiltrosProcesadorDto } from './dto/procesador.dto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { ComponentesService } from '../componentes/componentes.service';
import { AutenticadoGuard, UsuarioActual } from '../auth/guardias';
import { Usuario } from '../usuarios/usuario.entity';

// API REST que responde JSON. La usa el JavaScript del navegador (filtros en vivo,
// botón de favoritos) y también se puede probar con Postman.
@ApiTags('Procesadores')
@Controller('api')
export class ProcesadoresApiController {
  constructor(
    private readonly procesadores: ProcesadoresService,
    private readonly comparacion: ComparacionService,
    private readonly usuarios: UsuariosService,
    private readonly componentes: ComponentesService,
  ) {}

  @Get('procesadores')
  @ApiOperation({ summary: 'Ranking de procesadores con filtros (marca, zócalo, memoria, núcleos, precio, año)' })
  async listar(@Query(validacionApi) filtros: FiltrosProcesadorDto) {
    const resultados = await this.procesadores.listar(filtros);
    return { total: resultados.length, resultados: resultados.map(({ desglose: _d, ...p }) => p) };
  }

  @Get('procesadores/opciones')
  opciones() {
    return this.procesadores.opcionesFiltro();
  }

  @Get('procesadores/:id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.procesadores.obtener(id);
  }

  @Get('comparar')
  @ApiOperation({ summary: 'Compara dos procesadores: razones, tabla detallada y ganador' })
  async comparar(@Query('a', ParseIntPipe) a: number, @Query('b', ParseIntPipe) b: number) {
    if (a === b) throw new BadRequestException('Elige dos procesadores distintos');
    const [pa, pb] = await Promise.all([this.procesadores.obtener(a), this.procesadores.obtener(b)]);
    return this.comparacion.comparar(pa, pb);
  }

  @Get('favoritos')
  @UseGuards(AutenticadoGuard)
  async favoritos(@UsuarioActual() usuario: Usuario) {
    return { ids: await this.usuarios.idsFavoritos(usuario.id) };
  }

  @Post('favoritos/:id')
  @ApiOperation({ summary: 'Agrega o quita un componente de favoritos (requiere sesión)' })
  @UseGuards(AutenticadoGuard)
  async alternarFavorito(@Param('id', ParseIntPipe) id: number, @UsuarioActual() usuario: Usuario) {
    await this.componentes.obtener(id); // cualquier componente puede ser favorito
    return { id, favorito: await this.usuarios.alternarFavorito(usuario.id, id) };
  }
}
