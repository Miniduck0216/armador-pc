// Flujo de revisión de un armado (máquina de estados).
// Basado en el flujo de solicitudes del ejemplo ARF, reducido a lo que necesita el core.
//
//   borrador ──enviar──▶ enviado ──tomar──▶ en_revision ──aprobar──▶ aprobado
//      ▲                    ▲                    │ ──devolver──▶ por_corregir
//      │                    └────reenviar────────┘ (desde por_corregir)
//                                                └ ──rechazar──▶ rechazado

export type EstadoArmado = 'borrador' | 'enviado' | 'en_revision' | 'aprobado' | 'por_corregir' | 'rechazado';

export const ESTADOS: Record<EstadoArmado, string> = {
  borrador: 'Borrador',
  enviado: 'Enviado a revisión',
  en_revision: 'En revisión',
  aprobado: 'Aprobado',
  por_corregir: 'Por corregir',
  rechazado: 'Rechazado',
};

export type Accion = 'enviar' | 'tomar' | 'aprobar' | 'devolver' | 'rechazar';

// Quién hace cada acción, desde qué estados y a cuál lleva
export const TRANSICIONES: Record<Accion, { desde: EstadoArmado[]; hacia: EstadoArmado; quien: 'dueno' | 'revisor'; pideMotivo: boolean }> = {
  enviar: { desde: ['borrador', 'por_corregir'], hacia: 'enviado', quien: 'dueno', pideMotivo: false },
  tomar: { desde: ['enviado'], hacia: 'en_revision', quien: 'revisor', pideMotivo: false },
  aprobar: { desde: ['en_revision'], hacia: 'aprobado', quien: 'revisor', pideMotivo: false },
  devolver: { desde: ['en_revision'], hacia: 'por_corregir', quien: 'revisor', pideMotivo: true },
  rechazar: { desde: ['en_revision'], hacia: 'rechazado', quien: 'revisor', pideMotivo: true },
};

// Solo en estos estados el dueño puede cambiar las piezas
export const EDITABLES: EstadoArmado[] = ['borrador', 'por_corregir'];

// Estados que el técnico ve en su bandeja
export const PENDIENTES_REVISION: EstadoArmado[] = ['enviado', 'en_revision'];
