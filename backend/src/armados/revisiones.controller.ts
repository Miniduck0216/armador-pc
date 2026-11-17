import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArmadosService } from './armados.service';
import { AutenticadoGuard, Permisos, PermisosGuard, UsuarioActual } from '../auth/guardias';
import { Usuario } from '../usuarios/usuario.entity';
import { ESTADOS, EstadoArmado } from './flujo-armado';

// Bandeja de revisión del técnico (solo roles con el permiso armados.revisar)
@ApiTags('Revisión de armados')
@ApiCookieAuth('sesion')
@Controller('api/revisiones')
@UseGuards(AutenticadoGuard, PermisosGuard)
@Permisos('armados.revisar')
export class RevisionesController {
  constructor(private readonly armados: ArmadosService) {}

  @Get()
  @ApiOperation({ summary: 'Armados enviados o en revisión' })
  async pendientes(@UsuarioActual() usuario: Usuario) {
    return (await this.armados.pendientes()).map((a) => ({
      id: a.id,
      nombre: a.nombre,
      dueno: a.usuario?.nombre,
      estado: a.estado,
      nombreEstado: ESTADOS[a.estado as EstadoArmado],
      revisor: a.revisor?.nombre ?? null,
      esMio: a.revisor?.id === usuario.id,
      precioTotal: a.precioTotal,
      piezas: a.componentes.length,
      fechaEstado: a.fechaEstado,
    }));
  }
}
