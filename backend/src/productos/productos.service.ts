import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Componente } from '../componentes/componente.entity';
import { ComponentesService } from '../componentes/componentes.service';
import { CategoriasService } from '../categorias/categorias.service';
import { PreciosService, ResumenPrecio } from '../precios/precios.service';
import { ComunidadService } from '../comunidad/comunidad.service';
import { FiltrosProductoDto } from './dto/filtros.dto';

// Datos técnicos que se muestran en la ficha, a partir de las columnas del componente
const CAMPOS_FICHA: { clave: keyof Componente; etiqueta: string; unidad?: string; lista?: boolean }[] = [
  { clave: 'zocalo', etiqueta: 'Zócalo' },
  { clave: 'tipoMemoria', etiqueta: 'Tipo de memoria' },
  { clave: 'formato', etiqueta: 'Formato de placa' },
  { clave: 'formatosSoportados', etiqueta: 'Placas compatibles', lista: true },
  { clave: 'longitudMm', etiqueta: 'Largo', unidad: 'mm' },
  { clave: 'longitudMaxGpuMm', etiqueta: 'Largo máximo de tarjeta gráfica', unidad: 'mm' },
  { clave: 'zocalosSoportados', etiqueta: 'Zócalos compatibles', lista: true },
  { clave: 'capacidadTermicaW', etiqueta: 'Capacidad de disipación', unidad: 'W' },
  { clave: 'potenciaW', etiqueta: 'Potencia', unidad: 'W' },
  { clave: 'consumoW', etiqueta: 'Consumo estimado', unidad: 'W' },
];

// Datos en los que un número más alto o más bajo es mejor (para resaltar al comparar)
const MAYOR_ES_MEJOR = /capacidad|velocidad|lectura|frecuencia|potencia|memoria|ranuras|largo m[aá]ximo|sensor|tama[ñn]o|resoluci[oó]n|botones|ventiladores/i;
const MENOR_ES_MEJOR = /consumo|peso|latencia|precio/i;

// Datos clave para mostrar como etiquetas: "Sí" se convierte en el nombre del dato ("RGB")
export function destacados(c: Componente, cantidad = 3): string[] {
  return Object.entries(c.atributos ?? {})
    .map(([clave, valor]) => (valor === 'Sí' ? clave : valor === 'No' ? null : valor))
    .filter(Boolean)
    .slice(0, cantidad);
}

export interface ProductoTarjeta {
  id: number;
  nombre: string;
  marca: string;
  nombreCompleto: string;
  categoria: { codigo: string; nombre: string; icono: string };
  precio: number;
  precioReferencia: number;
  tienda: ResumenPrecio['tienda'];
  ofertas: number;
  conStock: number;
  hayStock: boolean;
  variacion: number | null; // % frente a hace 7 días
  puntaje: number;
  destacados: string[]; // 2 o 3 datos clave para la tarjeta
  calificacion: { promedio: number; total: number } | null;
  gama: Gama;
  tieneOfertas: boolean; // false = solo precio de referencia (ninguna tienda lo tiene)
  imagen: string | null;
  imagenCredito: string | null;
  imagenEsReferencia: boolean; // true = foto de un modelo parecido, no del producto exacto
  marcaYModelo: string;
}

export type Gama = 'Básica' | 'Media' | 'Alta' | 'Entusiasta';

// Gama según la posición del precio de referencia dentro de su categoría
export function calcularGamas(todos: Componente[]): Map<number, Gama> {
  const resultado = new Map<number, Gama>();
  const porCategoria = new Map<string, Componente[]>();
  for (const c of todos) porCategoria.set(c.categoria.codigo, [...(porCategoria.get(c.categoria.codigo) ?? []), c]);
  for (const lista of porCategoria.values()) {
    const orden = [...lista].sort((a, b) => a.precio - b.precio);
    orden.forEach((c, i) => {
      const p = orden.length > 1 ? i / (orden.length - 1) : 0.5;
      resultado.set(c.id, p < 0.25 ? 'Básica' : p < 0.6 ? 'Media' : p < 0.85 ? 'Alta' : 'Entusiasta');
    });
  }
  return resultado;
}

@Injectable()
export class ProductosService {
  constructor(
    private readonly componentes: ComponentesService,
    private readonly categorias: CategoriasService,
    private readonly precios: PreciosService,
    private readonly comunidad: ComunidadService,
  ) {}

  // Convierte componentes en tarjetas con precio, variación y calificación
  async tarjetas(lista: Componente[]): Promise<ProductoTarjeta[]> {
    const ids = lista.map((c) => c.id);
    const [precios, variaciones, calificaciones, todos] = await Promise.all([
      this.precios.mejoresPrecios(ids),
      this.precios.variaciones(7),
      this.comunidad.calificaciones(ids),
      this.componentes.listar(),
    ]);
    const gamas = calcularGamas(todos);
    return lista.map((c) => {
      const p = precios.get(c.id);
      return {
        id: c.id,
        nombre: c.nombre,
        marca: c.marca,
        nombreCompleto: `${c.marca} ${c.nombre}`,
        categoria: { codigo: c.categoria.codigo, nombre: c.categoria.nombre, icono: c.categoria.icono },
        precio: p?.mejor ?? c.precio,
        precioReferencia: c.precio,
        tienda: p?.tienda ?? null,
        ofertas: p?.ofertas ?? 0,
        conStock: p?.conStock ?? 0,
        hayStock: p?.hayStock ?? false,
        variacion: variaciones.get(c.id) ?? null,
        puntaje: c.puntajeRendimiento,
        destacados: destacados(c),
        calificacion: calificaciones.get(c.id) ?? null,
        gama: gamas.get(c.id) ?? 'Media',
        tieneOfertas: !!p?.mejor,
        imagen: c.imagenTienda || c.imagenUrl || null,
        imagenCredito: c.imagenTienda ? `Imagen: ${c.imagenTiendaOrigen}` : c.imagenCredito || null,
        imagenEsReferencia: !c.imagenTienda,
        marcaYModelo: `${c.marca} ${c.nombre}`,
      };
    });
  }

  async categoriasConConteo() {
    const [categorias, todos] = await Promise.all([this.categorias.listar(), this.componentes.listar()]);
    const precios = await this.precios.mejoresPrecios();
    return categorias.map((cat) => {
      const propios = todos.filter((c) => c.categoria.codigo === cat.codigo);
      const resumenes = propios.map((c) => precios.get(c.id)).filter(Boolean);
      const valores = resumenes.map((r) => r.mejor).filter((v) => v !== null);
      return {
        ...cat,
        referencias: propios.length,
        ofertas: resumenes.reduce((t, r) => t + r.ofertas, 0),
        conStock: resumenes.reduce((t, r) => t + r.conStock, 0),
        precioDesde: valores.length ? Math.min(...valores) : propios.length ? Math.min(...propios.map((c) => c.precio)) : null,
        conOfertas: resumenes.length,
      };
    });
  }

  async listar(f: FiltrosProductoDto) {
    const todos = await this.componentes.listar(f.categoria?.toUpperCase());
    let tarjetas = await this.tarjetas(todos);

    // Facetas: marcas y rango de precio ANTES de filtrar (para dibujar los filtros)
    const marcas = [...new Set(tarjetas.map((t) => t.marca))].sort();
    const preciosTodos = tarjetas.map((t) => t.precio);
    const rango = {
      min: preciosTodos.length ? Math.floor(Math.min(...preciosTodos)) : 0,
      max: preciosTodos.length ? Math.ceil(Math.max(...preciosTodos)) : 0,
    };

    // Cada palabra buscada debe aparecer (en cualquier orden)
    const palabras = (f.buscar ?? '').toLowerCase().split(/\s+/).filter(Boolean);
    const listaMarcas = f.marca ? f.marca.split(',').filter(Boolean) : [];
    const listaGamas = f.gama ? f.gama.split(',').filter(Boolean) : [];
    tarjetas = tarjetas.filter(
      (t) =>
        (!listaGamas.length || listaGamas.includes(t.gama)) &&
        palabras.every((p) => `${t.nombreCompleto} ${t.categoria.nombre} ${t.destacados.join(' ')}`.toLowerCase().includes(p)) &&
        (!listaMarcas.length || listaMarcas.includes(t.marca)) &&
        (f.precioMin === undefined || t.precio >= f.precioMin) &&
        (f.precioMax === undefined || t.precio <= f.precioMax) &&
        (!f.enStock || t.hayStock),
    );

    const ordenes: Record<string, (a: ProductoTarjeta, b: ProductoTarjeta) => number> = {
      relevancia: (a, b) => Number(b.hayStock) - Number(a.hayStock) || b.puntaje - a.puntaje || a.precio - b.precio,
      precio_asc: (a, b) => a.precio - b.precio,
      precio_desc: (a, b) => b.precio - a.precio,
      rendimiento: (a, b) => b.puntaje - a.puntaje || a.precio - b.precio,
      bajada: (a, b) => (a.variacion ?? 0) - (b.variacion ?? 0),
      nombre: (a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto),
    };
    tarjetas.sort(ordenes[f.orden ?? 'relevancia']);

    const limite = f.limite ?? 24;
    const paginas = Math.max(1, Math.ceil(tarjetas.length / limite));
    const pagina = Math.min(f.pagina ?? 1, paginas);
    return {
      total: tarjetas.length,
      pagina,
      paginas,
      limite,
      facetas: { marcas, gamas: ['Básica', 'Media', 'Alta', 'Entusiasta'], precio: rango },
      resultados: tarjetas.slice((pagina - 1) * limite, pagina * limite),
    };
  }

  async detalle(id: number) {
    const c = await this.componentes.obtener(id);
    const [[tarjeta], ofertas] = await Promise.all([this.tarjetas([c]), this.precios.ofertasDe(id)]);
    const ficha = this.ficha(c);

    // Otros de la misma categoría con precio parecido
    const hermanos = (await this.componentes.listar(c.categoria.codigo)).filter((x) => x.id !== id);
    const similares = (await this.tarjetas(hermanos))
      .sort((a, b) => Math.abs(a.precio - tarjeta.precio) - Math.abs(b.precio - tarjeta.precio))
      .slice(0, 4);

    const conStock = ofertas.filter((o) => o.enStock);
    const rango = conStock.length
      ? { min: Math.min(...conStock.map((o) => o.precio)), max: Math.max(...conStock.map((o) => o.precio)) }
      : null;

    const resenas = (await this.comunidad.resenasDe(id)).map((r) => ({
      id: r.id,
      calificacion: r.calificacion,
      comentario: r.comentario,
      fecha: r.fecha,
      usuario: { id: r.usuario.id, nombre: r.usuario.nombre },
    }));

    return {
      producto: tarjeta,
      componente: { ...c, especificacion: undefined },
      categoria: c.categoria,
      ofertas,
      ficha,
      similares,
      rango,
      esCpu: c.categoria.codigo === 'CPU',
      resenas,
      calificacion: this.comunidad.resumenCalificacion(resenas as any),
    };
  }

  // Compara de 2 a 3 componentes de la misma categoría: fila por dato con el mejor resaltado
  async comparar(ids: number[]) {
    ids = [...new Set(ids)].slice(0, 3);
    if (ids.length < 2) throw new BadRequestException('Elige al menos dos componentes para comparar');
    const lista = await this.componentes.buscarPorIds(ids);
    if (lista.length !== ids.length) throw new NotFoundException('Alguno de los componentes no existe');
    if (new Set(lista.map((c) => c.categoria.codigo)).size > 1) {
      throw new BadRequestException('Solo se pueden comparar componentes de la misma categoría');
    }
    const ordenados = ids.map((id) => lista.find((c) => c.id === id));
    const tarjetas = await this.tarjetas(ordenados);
    const fichas = ordenados.map((c) => this.ficha(c));

    // Une todas las etiquetas en el orden en que aparecen
    const etiquetas = [...new Set(fichas.flatMap((f) => f.map((x) => x.etiqueta)))];
    const filas = [
      this.fila('Mejor precio', tarjetas.map((t) => (t.tieneOfertas ? t.precio : null)), 'menor', (v) => `$${v.toFixed(2)}`),
      this.fila('Precio de referencia', tarjetas.map((t) => t.precioReferencia), 'menor', (v) => `$${v.toFixed(2)}`),
      ...(tarjetas.some((t) => t.puntaje) ? [this.fila('Puntaje de rendimiento', tarjetas.map((t) => t.puntaje || null), 'mayor', (v) => `${v} / 100`)] : []),
      ...etiquetas.map((e) => {
        const valores = fichas.map((f) => f.find((x) => x.etiqueta === e)?.valor ?? null);
        const sentido = MAYOR_ES_MEJOR.test(e) ? 'mayor' : MENOR_ES_MEJOR.test(e) ? 'menor' : null;
        return this.filaTexto(e, valores, sentido);
      }),
    ];

    // Resumen rápido: quién es más barato y quién rinde más
    const conPrecio = tarjetas.filter((t) => t.tieneOfertas);
    const masBarato = (conPrecio.length ? conPrecio : tarjetas).reduce((a, b) => (b.precio < a.precio ? b : a));
    const masPotente = tarjetas.some((t) => t.puntaje) ? tarjetas.reduce((a, b) => (b.puntaje > a.puntaje ? b : a)) : null;
    return {
      categoria: ordenados[0].categoria,
      productos: tarjetas,
      filas,
      resumen: {
        masBarato: { id: masBarato.id, nombre: masBarato.nombreCompleto, precio: masBarato.precio },
        masPotente: masPotente ? { id: masPotente.id, nombre: masPotente.nombreCompleto, puntaje: masPotente.puntaje } : null,
      },
    };
  }

  private fila(etiqueta: string, valores: (number | null)[], sentido: 'mayor' | 'menor', formato: (v: number) => string) {
    const validos = valores.filter((v) => v !== null && v !== undefined) as number[];
    const mejor = validos.length > 1 ? (sentido === 'mayor' ? Math.max(...validos) : Math.min(...validos)) : null;
    const empate = validos.filter((v) => v === mejor).length === validos.length;
    return {
      etiqueta,
      valores: valores.map((v) => (v === null || v === undefined ? '—' : formato(v))),
      ganadores: valores.map((v) => mejor !== null && !empate && v === mejor),
    };
  }

  // Para textos como "16 GB GDDR7" o "7300 MB/s" compara el primer número
  private filaTexto(etiqueta: string, valores: (string | null)[], sentido: 'mayor' | 'menor' | null) {
    const numeros = valores.map((v) => {
      const m = String(v ?? '').replace(/\s(?=\d{3}\b)/g, '').match(/\d+(?:[.,]\d+)?/);
      return m ? Number(m[0].replace(',', '.')) : null;
    });
    const comparables = sentido && numeros.filter((n) => n !== null).length > 1;
    const mejor = comparables ? (sentido === 'mayor' ? Math.max(...numeros.filter((n) => n !== null)) : Math.min(...numeros.filter((n) => n !== null))) : null;
    const empate = comparables && numeros.every((n) => n === mejor);
    return {
      etiqueta,
      valores: valores.map((v) => v ?? '—'),
      ganadores: numeros.map((n) => comparables && !empate && n === mejor),
      diferente: new Set(valores.map((v) => v ?? '—')).size > 1,
    };
  }

  // Datos técnicos de un componente en forma de lista (etiqueta, valor)
  ficha(c: Componente) {
    const ficha = CAMPOS_FICHA.filter((campo) => {
      const v = c[campo.clave];
      if (v === null || v === undefined || v === '' || v === 0) return false;
      return !(campo.clave === 'consumoW' && c.categoria.codigo === 'FUENTE');
    }).map((campo) => {
      const v = c[campo.clave] as any;
      const valor = campo.lista ? String(v).split(',').join(', ') : campo.unidad ? `${v} ${campo.unidad}` : String(v);
      return { etiqueta: campo.etiqueta, valor };
    });
    for (const [etiqueta, valor] of Object.entries(c.atributos ?? {})) ficha.push({ etiqueta, valor });
    return ficha;
  }

  // Productos con la mayor bajada de precio de la semana
  async bajadas(limite = 6) {
    const variaciones = await this.precios.variaciones(7);
    const ids = [...variaciones.entries()].filter(([, v]) => v <= -2).sort((a, b) => a[1] - b[1]).slice(0, limite).map(([id]) => id);
    const lista = await this.componentes.buscarPorIds(ids);
    const tarjetas = await this.tarjetas(lista);
    return tarjetas.sort((a, b) => (a.variacion ?? 0) - (b.variacion ?? 0));
  }

  async buscar(texto: string, limite = 8) {
    texto = (texto ?? '').trim();
    if (texto.length < 2) return [];
    const { resultados } = await this.listar({ buscar: texto, limite, orden: 'relevancia' });
    return resultados;
  }
}
