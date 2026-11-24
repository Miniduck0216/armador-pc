import { applyDecorators, Controller, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AutenticadoGuard, Permisos, PermisosGuard } from '../auth/guardias';

// ZONA SEGURA: todos los controladores del panel usan este decorador.
// Exige sesión iniciada, el permiso "panel.ver" y el permiso de la sección.
// Si una ruta pide otro permiso con @Permisos(...), PermisosGuard exige todos.
// (Los permisos de la clase van juntos aquí: dos @Permisos en la misma clase
// se pisarían y quedaría solo uno.)
export const ZonaAdmin = (seccion: string, permisoSeccion?: string) =>
  applyDecorators(
    ApiTags(`Administración · ${seccion}`),
    ApiCookieAuth('sesion'),
    Controller('api/admin'),
    UseGuards(AutenticadoGuard, PermisosGuard),
    Permisos('panel.ver', ...(permisoSeccion ? [permisoSeccion] : [])),
  );
