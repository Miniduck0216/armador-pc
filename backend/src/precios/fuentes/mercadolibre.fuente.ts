import { Injectable } from '@nestjs/common';
import { Tienda } from '../entidades/tienda.entity';
import { FuenteExterna, ResultadoTienda, pedirJson, textoPlano } from './tipos';

// API de Mercado Libre para el sitio de Ecuador (MEC). Desde 2025 la búsqueda pide un
// token de aplicación: se crea una app gratis en developers.mercadolibre.com.ec y se usan
// sus credenciales. Variables: MERCADOLIBRE_CLIENT_ID, MERCADOLIBRE_CLIENT_SECRET
@Injectable()
export class MercadoLibreFuente implements FuenteExterna {
  private readonly id = process.env.MERCADOLIBRE_CLIENT_ID;
  private readonly secreto = process.env.MERCADOLIBRE_CLIENT_SECRET;
  private token: { valor: string; vence: number } | null = null;

  disponible() {
    return !!(this.id && this.secreto);
  }

  private async obtenerToken() {
    if (this.token && this.token.vence > Date.now() + 60_000) return this.token.valor;
    const datos = await pedirJson('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: this.id, client_secret: this.secreto }),
    });
    this.token = { valor: datos.access_token, vence: Date.now() + Number(datos.expires_in ?? 21600) * 1000 };
    return this.token.valor;
  }

  async buscar(_tienda: Tienda, consulta: string): Promise<ResultadoTienda[]> {
    const token = await this.obtenerToken();
    const url = `https://api.mercadolibre.com/sites/MEC/search?q=${encodeURIComponent(consulta)}&limit=20&condition=new`;
    const datos = await pedirJson(url, { headers: { Authorization: `Bearer ${token}` } });
    return (datos?.results ?? [])
      .filter((r: any) => r.currency_id === 'USD' && r.condition !== 'used')
      .map((r: any) => ({
        idExterno: r.id,
        titulo: textoPlano(r.title),
        precio: Number(r.price),
        enStock: (r.available_quantity ?? 1) > 0,
        url: r.permalink,
        imagen: r.thumbnail ? String(r.thumbnail).replace('http://', 'https://') : null,
      }));
  }
}
