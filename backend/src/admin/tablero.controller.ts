import { Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Permisos } from '../auth/guardias';
import { publico } from '../auth/auth.controller';
import { UsuariosService } from '../usuarios/usuarios.service';
import { ComponentesService } from '../componentes/componentes.service';
import { PreciosService } from '../precios/precios.service';
import { TareaPreciosService } from '../precios/tarea-precios.service';
import { AlertasService } from '../precios/alertas.service';
import { ArmadosService } from '../armados/armados.service';
import { ComunidadService } from '../comunidad/comunidad.service';
import { ReglasService } from '../reglas/reglas.service';
import { ZonaAdmin } from './zona-admin';

// Panel: tablero, reportes de datos incorrectos y reglas de compatibilidad
@ZonaAdmin('Tablero y reportes')
export class TableroController {
  constructor(
    private readonly usuarios: UsuariosService,
    private readonly componentes: ComponentesService,
    private readonly precios: PreciosService,
    private readonly tarea: TareaPreciosService,
    private readonly alertas: AlertasService,
    private readonly armados: ArmadosService,
    private readonly comunidad: ComunidadService,
    private readonly reglas: ReglasService,
  ) {}

  @Get('tablero')
  @ApiOperation({ summary: 'Cifras generales del sistema' })
  async tablero() {
    return {
      cifras: {
        usuarios: await this.usuarios.contar(),
        componentes: await this.componentes.contar(),
        ofertas: await this.precios.contarOfertas(),
        armados: await this.armados.contar(),
        resenas: await this.comunidad.contarResenas(),
        reportes: await this.comunidad.contarReportesPendientes(),
        alertas: await this.alertas.contar(),
      },
      precios: { ...this.tarea.estado, ultimaActualizacion: await this.precios.ultimaActualizacion() },
      ultimosUsuarios: (await this.usuarios.listar()).slice(0, 5).map(publico),
    };
  }

  @Get('reportes')
  @Permisos('reportes.gestionar')
  async reportes() {
    return (await this.comunidad.listarReportes()).map((r) => ({
      id: r.id,
      mensaje: r.mensaje,
      estado: r.estado,
      fecha: r.fecha,
      usuario: r.usuario?.nombre,
      componente: { id: r.componente.id, nombre: `${r.componente.marca} ${r.componente.nombre}` },
    }));
  }

  @Patch('reportes/:id/resolver')
  @Permisos('reportes.gestionar')
  async resolver(@Param('id', ParseIntPipe) id: number) {
    await this.comunidad.resolverReporte(id);
    return { ok: true };
  }

  @Get('reglas')
  @Permisos('reglas.ver')
  reglasLista() {
    return this.reglas.listar();
  }
}
