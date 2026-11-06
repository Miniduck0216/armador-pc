import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AutenticadoGuard, UsuarioActual } from '../auth/guardias';
import { Usuario } from '../usuarios/usuario.entity';
import { UsuariosService } from '../usuarios/usuarios.service';
import { ComunidadService } from '../comunidad/comunidad.service';
import { ArmadosService } from '../armados/armados.service';
import { AlertasService } from '../precios/alertas.service';
import { PreciosService } from '../precios/precios.service';
import { ProductosService } from '../productos/productos.service';
import { publico } from '../auth/auth.controller';

// Panel personal: alertas, favoritos, armados, comparaciones y reseñas
@ApiTags('Cuenta')
@ApiCookieAuth('sesion')
@Controller('api/cuenta')
@UseGuards(AutenticadoGuard)
export class CuentaController {
  constructor(
    private readonly usuarios: UsuariosService,
    private readonly comunidad: ComunidadService,
    private readonly armados: ArmadosService,
    private readonly alertas: AlertasService,
    private readonly precios: PreciosService,
    private readonly productos: ProductosService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Todo lo del usuario en una sola respuesta' })
  async panel(@UsuarioActual() usuario: Usuario) {
    const alertas = await this.alertas.listar(usuario.id);
    const precios = await this.precios.mejoresPrecios(alertas.map((a) => a.componente.id));
    const vistaAlertas = alertas.map((a) => {
      const actual = precios.get(a.componente.id)?.mejor ?? null;
      return {
        id: a.id,
        componente: { id: a.componente.id, nombre: `${a.componente.marca} ${a.componente.nombre}`, imagen: a.componente.imagenTienda || a.componente.imagenUrl },
        precioObjetivo: a.precioObjetivo,
        precioInicial: a.precioInicial,
        actual,
        falta: actual !== null ? Math.max(0, Math.round((actual - a.precioObjetivo) * 100) / 100) : null,
        disparada: a.disparada,
        precioAlcanzado: a.precioAlcanzado,
        fechaDisparo: a.fechaDisparo,
        nueva: a.disparada && !a.vista,
      };
    });
    await this.alertas.marcarVistas(usuario.id); // al abrir la cuenta se dan por vistas

    return {
      perfil: { ...publico(usuario), fechaRegistro: usuario.fechaRegistro },
      alertas: vistaAlertas,
      favoritos: await this.productos.tarjetas(await this.usuarios.favoritos(usuario.id)),
      armados: (await this.armados.listarDe(usuario.id)).map((a) => ({
        id: a.id,
        nombre: a.nombre,
        fechaCreacion: a.fechaCreacion,
        esCompatible: a.esCompatible,
        puntajeTotal: a.puntajeTotal,
        precioTotal: a.precioTotal,
        precioHoy: (a as any).precioHoy,
        diferencia: (a as any).diferencia,
        piezas: a.componentes.length,
      })),
      comparaciones: (await this.comunidad.comparacionesDe(usuario.id)).map((c) => ({
        id: c.id,
        fecha: c.fecha,
        a: { id: c.componenteA.id, nombre: `${c.componenteA.marca} ${c.componenteA.nombre}` },
        b: { id: c.componenteB.id, nombre: `${c.componenteB.marca} ${c.componenteB.nombre}` },
      })),
      resenas: (await this.comunidad.resenasDeUsuario(usuario.id)).map((r) => ({
        id: r.id,
        calificacion: r.calificacion,
        comentario: r.comentario,
        fecha: r.fecha,
        componente: { id: r.componente.id, nombre: `${r.componente.marca} ${r.componente.nombre}` },
      })),
    };
  }
}
