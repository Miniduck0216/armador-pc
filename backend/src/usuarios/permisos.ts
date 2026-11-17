import { Usuario } from './usuario.entity';

// Catálogo de permisos del sistema: [código, nombre, módulo]
export const PERMISOS: [string, string, string][] = [
  ['panel.ver', 'Entrar al panel de administración', 'Panel'],
  ['componentes.gestionar', 'Crear, editar y eliminar componentes', 'Catálogo'],
  ['reglas.ver', 'Ver las reglas de compatibilidad', 'Catálogo'],
  ['precios.gestionar', 'Gestionar tiendas y cargar precios', 'Precios'],
  ['armados.revisar', 'Revisar armados de otros usuarios', 'Armados'],
  ['reportes.gestionar', 'Resolver reportes de datos incorrectos', 'Comunidad'],
  ['resenas.moderar', 'Eliminar reseñas de otros usuarios', 'Comunidad'],
  ['usuarios.gestionar', 'Crear usuarios, cambiar su rol y activarlos', 'Usuarios'],
  ['roles.gestionar', 'Crear roles y asignar permisos', 'Usuarios'],
];

// Roles iniciales: [código, nombre, descripción, permisos]
export const ROLES_INICIALES: [string, string, string, string[]][] = [
  ['admin', 'Administrador', 'Acceso total al sistema', PERMISOS.map(([codigo]) => codigo)],
  ['tecnico', 'Técnico', 'Mantiene el catálogo y los precios, y revisa armados',
    ['panel.ver', 'componentes.gestionar', 'reglas.ver', 'precios.gestionar', 'armados.revisar', 'reportes.gestionar']],
  ['usuario', 'Usuario', 'Arma su PC, guarda armados y escribe reseñas', []],
];

// Rol que reciben las cuentas nuevas creadas desde el registro
export const ROL_POR_DEFECTO = 'usuario';

// Permisos efectivos = los del rol + los agregados a la persona − los quitados a la persona.
// El Administrador siempre conserva todos los de su rol.
export const permisosDe = (u?: Usuario | null): string[] => {
  const delRol = new Set(u?.rol?.permisos?.map((p) => p.codigo) ?? []);
  if (u?.rol?.codigo === 'admin') return [...delRol];
  for (const a of u?.ajustesPermisos ?? []) {
    if (a.concedido) delRol.add(a.permiso.codigo);
    else delRol.delete(a.permiso.codigo);
  }
  return [...delRol];
};

export const tienePermiso = (u: Usuario | null | undefined, codigo: string) => permisosDe(u).includes(codigo);
