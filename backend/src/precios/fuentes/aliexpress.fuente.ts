import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import { Tienda } from '../entidades/tienda.entity';
import { FuenteExterna, ResultadoTienda, pedirJson, textoPlano } from './tipos';

// API de afiliados de AliExpress (Open Platform). Requiere registrarse gratis en
// developers.aliexpress.com (App Key y App Secret) y en portals.aliexpress.com (Tracking ID).
// Variables: ALIEXPRESS_APP_KEY, ALIEXPRESS_APP_SECRET, ALIEXPRESS_TRACKING_ID
// Método: aliexpress.affiliate.product.query, precios en USD con envío a Ecuador (EC).
@Injectable()
export class AliExpressFuente implements FuenteExterna {
  private readonly clave = process.env.ALIEXPRESS_APP_KEY;
  private readonly secreto = process.env.ALIEXPRESS_APP_SECRET;
  private readonly seguimiento = process.env.ALIEXPRESS_TRACKING_ID;

  disponible() {
    return !!(this.clave && this.secreto && this.seguimiento);
  }

  // Firma HMAC-SHA256 de los parámetros ordenados alfabéticamente (clave+valor concatenados)
  static firmar(parametros: Record<string, string>, secreto: string) {
    const base = Object.keys(parametros)
      .sort()
      .map((k) => k + parametros[k])
      .join('');
    return createHmac('sha256', secreto).update(base, 'utf8').digest('hex').toUpperCase();
  }

  async buscar(_tienda: Tienda, consulta: string): Promise<ResultadoTienda[]> {
    const parametros: Record<string, string> = {
      app_key: this.clave,
      method: 'aliexpress.affiliate.product.query',
      sign_method: 'sha256',
      timestamp: String(Date.now()),
      keywords: consulta,
      page_size: '20',
      tracking_id: this.seguimiento,
      target_currency: 'USD',
      target_language: 'ES',
      ship_to_country: 'EC',
    };
    parametros.sign = AliExpressFuente.firmar(parametros, this.secreto);
    const url = 'https://api-sg.aliexpress.com/sync?' + new URLSearchParams(parametros);
    const datos = await pedirJson(url, { method: 'POST' });

    const resultado = datos?.aliexpress_affiliate_product_query_response?.resp_result;
    if (resultado?.resp_code && resultado.resp_code !== 200) throw new Error(`AliExpress: ${resultado.resp_msg}`);
    const productos: any[] = resultado?.result?.products?.product ?? [];
    return productos.map((p) => ({
      idExterno: String(p.product_id),
      titulo: textoPlano(p.product_title),
      precio: Number(p.target_sale_price ?? p.sale_price ?? 0),
      enStock: true,
      url: p.promotion_link || p.product_detail_url,
      imagen: p.product_main_image_url ?? null,
    }));
  }
}
