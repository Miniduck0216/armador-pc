import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArmadosService } from './armados.service';
import { AutenticadoGuard, UsuarioActual } from '../auth/guardias';
import { Usuario } from '../usuarios/usuario.entity';
import { ConfiguradorService } from '../configurador/configurador.service';
import { validarFormulario } from '../comun/validar';
import { AccionArmadoDto } from './dto/flujo.dto';
import { ESTADOS, EDITABLES, EstadoArmado } from './flujo-armado';
import { tienePermiso } from '../usuarios/permisos';

// Armados guardados por cada usuario (zona protegida)
@ApiTags('Armados guardados')
@ApiCookieAuth('sesion')
@Controller('api/armados')
@UseGuards(AutenticadoGuard)
export class ArmadosController {
  constructor(private readonly armados: ArmadosService) {}

  @Get()
  @ApiOperation({ summary: 'Armados del usuario con su precio de hoy' })
  listar(@UsuarioActual() usuario: Usuario) {
    return this.armados.listarDe(usuario.id);
  }

  @Post()
  @ApiOperation({ summary: 'Guarda un armado: { nombre, piezas: [ids] }' })
  async crear(@Body() cuerpo: { nombre?: string; piezas?: number[] | string }, @UsuarioActual() usuario: Usuario) {
    const armado = await this.armados.crear(usuario, cuerpo.nombre, ConfiguradorService.ids(cuerpo.piezas));
    return { id: armado.id };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un armado con precios y compatibilidad actuales' })
  async detalle(@Param('id', ParseIntPipe) id: number, @UsuarioActual() usuario: Usuario) {
    const { armado, resumen, diferencia } = await this.armados.detalle(id, usuario);
    const historial = await this.armados.historialDe(id);
    const esDueno = armado.usuario?.id === usuario.id;
    // Solo lo que necesita la vista (sin datos de la cuenta ni columnas internas)
    return {
      armado: {
        id: armado.id,
        nombre: armado.nombre,
        fechaCreacion: armado.fechaCreacion,
        precioTotal: armado.precioTotal,
        consumoTotal: armado.consumoTotal,
        puntajeTotal: armado.puntajeTotal,
        esCompatible: armado.esCompatible,
        estado: armado.estado,
        nombreEstado: ESTADOS[armado.estado as EstadoArmado],
        motivo: armado.motivo,
        dueno: armado.usuario?.nombre,
        revisor: armado.revisor?.nombre ?? null,
      },
      // Qué puede hacer quien está mirando (el backend igual lo vuelve a comprobar)
      puede: {
        editar: esDueno && EDITABLES.includes(armado.estado as EstadoArmado),
        enviar: esDueno && ['borrador', 'por_corregir'].includes(armado.estado),
        tomar: !esDueno && tienePermiso(usuario, 'armados.revisar') && armado.estado === 'enviado',
        decidir: !esDueno && armado.estado === 'en_revision' && armado.revisor?.id === usuario.id,
        eliminar: esDueno && !['enviado', 'en_revision'].includes(armado.estado),
      },
      historial: historial.map((h) => ({
        fecha: h.fecha,
        usuario: h.usuario?.nombre ?? 'Cuenta eliminada',
        de: ESTADOS[h.estadoAnterior as EstadoArmado] ?? h.estadoAnterior,
        a: ESTADOS[h.estadoNuevo as EstadoArmado] ?? h.estadoNuevo,
        estadoNuevo: h.estadoNuevo,
        comentario: h.comentario,
      })),
      resumen,
      diferencia,
    };
  }

  @Post(':id/flujo')
  @HttpCode(200)
  @ApiOperation({ summary: 'Acción del flujo: { accion: enviar|tomar|aprobar|devolver|rechazar, comentario? }' })
  async flujo(@Param('id', ParseIntPipe) id: number, @Body() cuerpo: any, @UsuarioActual() usuario: Usuario) {
    const { dto, errores } = await validarFormulario(AccionArmadoDto, cuerpo);
    if (errores.length) throw new BadRequestException(errores);
    return this.armados.aplicarAccion(id, usuario, dto.accion, dto.comentario);
  }

  @Put(':id/piezas')
  @ApiOperation({ summary: 'Cambia las piezas (solo en Borrador o Por corregir): { piezas: [ids] }' })
  piezas(@Param('id', ParseIntPipe) id: number, @Body() cuerpo: { piezas?: number[] | string }, @UsuarioActual() usuario: Usuario) {
    return this.armados.actualizarPiezas(id, usuario, ConfiguradorService.ids(cuerpo.piezas));
  }

  @Post(':id/compartir')
  @HttpCode(200)
  @ApiOperation({ summary: 'Crea el enlace público del armado (o devuelve el que ya existe)' })
  compartir(@Param('id', ParseIntPipe) id: number, @UsuarioActual() usuario: Usuario) {
    return this.armados.compartir(id, usuario);
  }

  @Delete(':id')
  @HttpCode(204)
  async eliminar(@Param('id', ParseIntPipe) id: number, @UsuarioActual() usuario: Usuario) {
    await this.armados.eliminar(id, usuario);
  }
}

// Enlace público de un armado compartido (sin sesión)
@ApiTags('Armados compartidos')
@Controller('api/compartidos')
export class CompartidosController {
  constructor(private readonly armados: ArmadosService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Vista pública de un armado compartido' })
  publico(@Param('token') token: string) {
    return this.armados.publico(token);
  }
}
