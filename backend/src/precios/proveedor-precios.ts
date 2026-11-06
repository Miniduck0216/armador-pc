import { Componente } from '../componentes/componente.entity';

// ---------------------------------------------------------------------------
// Contrato que debe cumplir cualquier fuente de precios.
//
// En este proyecto los precios los genera SimuladorPreciosService porque las
// tiendas son ficticias. Para usar precios reales se crea otra clase que
// implemente esta interfaz y consulte la API de una tienda o un servicio de
// comparación (normalmente requieren registrarse y una clave de acceso), y se
// cambia el proveedor en precios.module.ts. El resto del sistema (fichas,
// historial, alertas, configurador) no necesita cambios.
// ---------------------------------------------------------------------------

export interface ResultadoActualizacion {
  ofertasActualizadas: number;
  diasSimulados: number;
  fecha: Date;
}

export interface ProveedorPrecios {
  // Crea las ofertas (y su historial) de un componente nuevo
  registrarComponente(componente: Componente): Promise<void>;

  // Ajusta las ofertas cuando cambia el precio de referencia
  rebasar(componenteId: number, precioAnterior: number, precioNuevo: number): Promise<void>;

  // Consulta los precios actuales de todas las ofertas y guarda el historial
  actualizar(): Promise<ResultadoActualizacion>;
}

export const PROVEEDOR_PRECIOS = 'PROVEEDOR_PRECIOS';
