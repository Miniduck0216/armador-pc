import { Injectable } from '@nestjs/common';
import { Tienda } from '../entidades/tienda.entity';
import { FuenteExterna, IVA_ECUADOR, ResultadoTienda, pedirJson, textoPlano } from './tipos';

// Muchas tiendas de Ecuador usan WordPress + WooCommerce, que publica una API
// pública de solo lectura para su propio catálogo (la misma que usa la tienda en el navegador):
//   GET https://tienda.com/wp-json/wc/store/v1/products?search=rtx%205070&per_page=20
// No necesita claves. Se consulta con poca frecuencia para no cargar a la tienda.
@Injectable()
export class WooCommerceFuente implements FuenteExterna {
  disponible() {
    return true;
  }

  async buscar(tienda: Tienda, consulta: string): Promise<ResultadoTienda[]> {
    const url = new URL('/wp-json/wc/store/v1/products', tienda.sitioWeb);
    url.searchParams.set('search', consulta);
    url.searchParams.set('per_page', '20');
    const productos: any[] = await pedirJson(url.toString());
    if (!Array.isArray(productos)) return [];

    return productos
      .filter((p) => p.type !== 'variable' || p.prices?.price) // los variables sin precio no sirven
      .map((p) => {
        const decimales = Number(p.prices?.currency_minor_unit ?? 2);
        let precio = Number(p.prices?.price ?? 0) / 10 ** decimales;
        if (this.sinIva(tienda, p.price_html)) precio = precio * (1 + IVA_ECUADOR);
        return {
          idExterno: String(p.id),
          titulo: textoPlano(p.name),
          precio: Math.round(precio * 100) / 100,
          enStock: p.is_in_stock !== false,
          url: p.permalink,
          imagen: p.images?.[0]?.thumbnail || p.images?.[0]?.src || null,
        };
      })
      .filter((r) => r.precio > 0);
  }

  // Algunas tiendas publican el precio sin IVA ("+ IVA", "sin IVA", "no incluye IVA")
  private sinIva(tienda: Tienda, precioHtml: string): boolean {
    if (tienda.ivaIncluido === true) return false;
    if (tienda.ivaIncluido === false) return true;
    const texto = textoPlano(precioHtml).toLowerCase();
    return /(\+|sin|m[aá]s|no incluye|excluye|excl\.?)\s*(el\s*)?iva/.test(texto);
  }
}
