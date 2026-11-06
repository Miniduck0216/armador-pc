import { Tienda } from '../entidades/tienda.entity';

// Un producto tal como lo devuelve la API de una tienda
export interface ResultadoTienda {
  idExterno: string;
  titulo: string;
  precio: number; // en dólares, con IVA incluido
  enStock: boolean;
  url: string;
  imagen: string | null;
}

// Adaptador para consultar una fuente de precios (WooCommerce, AliExpress, Mercado Libre...)
export interface FuenteExterna {
  // ¿Puede usarse ahora? (por ejemplo, si faltan las claves de la API devuelve false)
  disponible(): boolean;
  buscar(tienda: Tienda, consulta: string): Promise<ResultadoTienda[]>;
}

export const AGENTE = 'ArmadorPC/2.0 (proyecto academico; comparador de precios)';

// fetch con tiempo límite y errores claros
export async function pedirJson(url: string, opciones: RequestInit = {}, segundos = 20): Promise<any> {
  const respuesta = await fetch(url, {
    ...opciones,
    headers: { 'User-Agent': AGENTE, Accept: 'application/json', ...(opciones.headers ?? {}) },
    signal: AbortSignal.timeout(segundos * 1000),
  });
  if (!respuesta.ok) {
    const texto = await respuesta.text().catch(() => '');
    throw new Error(`HTTP ${respuesta.status} en ${new URL(url).hostname}: ${texto.slice(0, 120)}`);
  }
  return respuesta.json();
}

export const IVA_ECUADOR = 0.15;

// Quita etiquetas HTML y entidades sencillas de un título
export function textoPlano(html: string): string {
  return String(html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#8243;|&quot;/g, '"')
    .replace(/&#8211;|&#8212;/g, '-')
    .replace(/&amp;/g, '&')
    .replace(/&([aeiou])acute;/gi, (_m, v) => ({ a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú' })[v])
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&#(\d+);/g, (_m, n) => (Number(n) < 0x2000 ? String.fromCharCode(Number(n)) : ' '))
    .replace(/&#0?36;/g, '$')
    .replace(/&[a-z]+;|&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
