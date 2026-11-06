import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AutenticadoGuard, Roles, RolesGuard, UsuarioActual } from '../auth/guardias';
import { Usuario } from '../usuarios/usuario.entity';
import { UsuariosService } from '../usuarios/usuarios.service';
import { ProcesadoresService } from '../procesadores/procesadores.service';
import { ComunidadService } from '../comunidad/comunidad.service';
import { ArmadosService } from '../armados/armados.service';
import { ProcesadorDto } from '../procesadores/dto/procesador.dto';
import { validarFormulario } from '../comun/validar';
import { PreciosService } from '../precios/precios.service';
import { TareaPreciosService } from '../precios/tarea-precios.service';
import { AlertasService } from '../precios/alertas.service';
import { ComponentesService } from '../componentes/componentes.service';
import { ReglasService } from '../reglas/reglas.service';
import { publico } from '../auth/auth.controller';
import { OfertaAdminDto } from './dto/oferta-admin.dto';
import { UsuarioAdminDto } from './dto/usuario-admin.dto';

// ZONA SEGURA: todo este controlador exige sesión iniciada y rol de administrador
@ApiTags('Administración')
@ApiCookieAuth('sesion')
@Controller('api/admin')
@UseGuards(AutenticadoGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    private readonly usuarios: UsuariosService,
    private readonly procesadores: ProcesadoresService,
    private readonly comunidad: ComunidadService,
    private readonly armados: ArmadosService,
    private readonly precios: PreciosService,
    private readonly tarea: TareaPreciosService,
    private readonly alertas: AlertasService,
    private readonly componentes: ComponentesService,
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

  // ---- Procesadores ----
  @Get('procesadores')
  async listaProcesadores() {
    return (await this.procesadores.todos()).map(({ desglose: _d, ...p }) => p);
  }

  @Post('procesadores')
  @ApiOperation({ summary: 'Crea un procesador (los puntajes se recalculan)' })
  async crear(@Body() cuerpo: any) {
    const { dto, errores } = await validarFormulario(ProcesadorDto, cuerpo);
    if (errores.length) throw new BadRequestException(errores);
    const creado = await this.procesadores.crear(dto);
    return { id: creado.id };
  }

  @Put('procesadores/:id')
  async actualizar(@Param('id', ParseIntPipe) id: number, @Body() cuerpo: any) {
    const { dto, errores } = await validarFormulario(ProcesadorDto, cuerpo);
    if (errores.length) throw new BadRequestException(errores);
    await this.procesadores.actualizar(id, dto);
    return { ok: true };
  }

  @Delete('procesadores/:id')
  @HttpCode(204)
  async eliminar(@Param('id', ParseIntPipe) id: number) {
    await this.procesadores.eliminar(id);
  }

  // ---- Tiendas y precios ----
  @Get('precios')
  @ApiOperation({ summary: 'Tiendas, estado de la sincronización y modo de precios' })
  async preciosPanel() {
    return {
      estado: this.tarea.estado,
      tiendas: await this.precios.estadisticasTiendas(),
      ultimaActualizacion: await this.precios.ultimaActualizacion(),
      claves: {
        aliexpress: !!process.env.ALIEXPRESS_APP_KEY,
        mercadolibre: !!process.env.MERCADOLIBRE_CLIENT_ID,
      },
    };
  }

  @Post('precios/actualizar')
  @ApiOperation({ summary: 'Lanza la actualización de precios en segundo plano' })
  actualizarPrecios() {
    if (this.tarea.estado.enCurso) return { mensaje: 'Ya hay una actualización en curso' };
    this.tarea.enSegundoPlano();
    return { mensaje: 'Actualización iniciada. Puede tardar unos minutos en las tiendas reales.' };
  }

  // Lista para los menús desplegables del formulario de precios
  @Get('tiendas')
  async listaTiendas() {
    return (await this.precios.listarTiendas()).map((t) => ({ id: t.id, nombre: t.nombre }));
  }

  // Componentes de UNA categoría: el segundo menú del formulario depende del primero
  @Get('componentes')
  async componentesDeCategoria(@Query('categoria') categoria?: string) {
    if (!categoria || !/^[A-Z]{2,10}$/.test(categoria)) throw new BadRequestException('Primero elige una categoría');
    return (await this.componentes.listar(categoria)).map((c) => ({ id: c.id, nombre: c.nombre, marca: c.marca }));
  }

  @Post('ofertas')
  @ApiOperation({ summary: 'Carga o actualiza el precio de un componente en una tienda' })
  async guardarOferta(@Body() cuerpo: any) {
    const { dto, errores } = await validarFormulario(OfertaAdminDto, cuerpo);
    if (errores.length) throw new BadRequestException(errores);
    const id = await this.precios.guardarOferta(dto);
    return { id };
  }

  @Patch('tiendas/:id/alternar')
  async alternarTienda(@Param('id', ParseIntPipe) id: number) {
    await this.precios.alternarTienda(id);
    return { ok: true };
  }

  // ---- Usuarios ----
  @Post('usuarios')
  @ApiOperation({ summary: 'Crea una cuenta con validación de correo, contraseña y rol en el servidor' })
  async crearUsuario(@Body() cuerpo: any) {
    const { dto, errores } = await validarFormulario(UsuarioAdminDto, cuerpo);
    if (errores.length) throw new BadRequestException(errores);
    const creado = await this.usuarios.crear(dto.nombre, dto.correo, dto.contrasena, dto.rol);
    return { id: creado.id };
  }

  @Get('usuarios')
  async usuariosLista(@UsuarioActual() actual: Usuario) {
    return (await this.usuarios.listar()).map((u) => ({
      ...publico(u),
      activo: u.activo,
      fechaRegistro: u.fechaRegistro,
      ultimoIngreso: u.ultimoIngreso,
      esYo: u.id === actual.id,
    }));
  }

  @Patch('usuarios/:id')
  async cambiarUsuario(@Param('id', ParseIntPipe) id: number, @Body() cuerpo: { rol?: string; activo?: boolean }, @UsuarioActual() actual: Usuario) {
    // Un administrador no puede modificarse a sí mismo (evita quedarse sin administradores)
    if (id === actual.id) throw new BadRequestException('No puedes cambiar tu propia cuenta');
    if (cuerpo.rol === 'admin' || cuerpo.rol === 'usuario') await this.usuarios.cambiarRol(id, cuerpo.rol);
    if (typeof cuerpo.activo === 'boolean') await this.usuarios.cambiarEstado(id, cuerpo.activo);
    return { ok: true };
  }

  // ---- Reportes y reglas ----
  @Get('reportes')
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
  async resolver(@Param('id', ParseIntPipe) id: number) {
    await this.comunidad.resolverReporte(id);
    return { ok: true };
  }

  @Get('reglas')
  reglasLista() {
    return this.reglas.listar();
  }
}
