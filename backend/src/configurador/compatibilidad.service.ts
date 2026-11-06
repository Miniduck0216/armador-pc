import { Injectable } from '@nestjs/common';
import { Componente } from '../componentes/componente.entity';
import { ReglasService } from '../reglas/reglas.service';
import { ReglaCompatibilidad } from '../reglas/regla-compatibilidad.entity';

export interface ResultadoRegla {
  regla: string;
  cumple: boolean;
  omitida: boolean; // faltan piezas para evaluarla
  detalle: string;
  categorias: string[]; // categorías involucradas (para marcar la pieza con problema)
}

export interface ResultadoCompatibilidad {
  esCompatible: boolean;
  resultados: ResultadoRegla[];
  errores: string[];
}

// Separa listas guardadas como "AM4,AM5" o "DDR4/DDR5"
const lista = (valor: any) => String(valor ?? '').split(/[,/]/).map((v) => v.trim()).filter(Boolean);

// Motor de compatibilidad: lee las reglas desde la base de datos y las aplica.
// Para agregar una regla nueva NO hace falta tocar este código, solo insertar
// un registro en la tabla reglas_compatibilidad con uno de los tipos soportados.
@Injectable()
export class CompatibilidadService {
  constructor(private readonly reglas: ReglasService) {}

  async verificar(componentes: Componente[], reglas?: ReglaCompatibilidad[]): Promise<ResultadoCompatibilidad> {
    reglas ??= await this.reglas.listarActivas();
    const porCategoria = new Map(componentes.map((c) => [c.categoria.codigo, c]));
    const resultados = reglas.map((regla) => this.evaluar(regla, porCategoria, componentes));
    const errores = resultados.filter((r) => !r.cumple && !r.omitida).map((r) => r.detalle);
    return { esCompatible: errores.length === 0, resultados, errores };
  }

  // ¿El candidato encaja con lo ya elegido? Devuelve el primer motivo de conflicto o null
  async conflicto(candidato: Componente, seleccion: Componente[], reglas: ReglaCompatibilidad[]): Promise<string | null> {
    const codigo = candidato.categoria.codigo;
    const conjunto = [...seleccion.filter((c) => c.categoria.codigo !== codigo), candidato];
    const { resultados } = await this.verificar(conjunto, reglas);
    const falla = resultados.find((r) => !r.cumple && !r.omitida && r.categorias.includes(codigo));
    return falla ? falla.detalle : null;
  }

  private evaluar(regla: ReglaCompatibilidad, porCategoria: Map<string, Componente>, todos: Componente[]): ResultadoRegla {
    const base = { regla: regla.nombre, categorias: [regla.categoriaOrigen, regla.categoriaDestino].filter(Boolean) };
    const destino = porCategoria.get(regla.categoriaDestino);

    if (regla.tipo === 'suma_consumo') {
      if (!destino) return { ...base, cumple: true, omitida: true, detalle: 'Falta elegir la fuente de poder' };
      const consumo = todos
        .filter((c) => c.categoria.codigo !== regla.categoriaDestino)
        .reduce((total, c) => total + (c.consumoW || 0), 0);
      const requerido = Math.ceil(consumo * (1 + regla.margen / 100));
      const disponible = destino[regla.atributoDestino] || 0;
      const cumple = disponible >= requerido;
      // Una fuente insuficiente es culpa de la fuente y también de las piezas que más consumen
      return {
        ...base,
        categorias: ['FUENTE', 'GPU', 'CPU'],
        cumple,
        omitida: false,
        detalle: cumple
          ? `La fuente entrega ${disponible} W y el equipo necesita ${requerido} W (con ${regla.margen} % de margen)`
          : this.formatear(regla.mensajeError, requerido, disponible),
      };
    }

    const origen = porCategoria.get(regla.categoriaOrigen);
    if (!origen || !destino) return { ...base, cumple: true, omitida: true, detalle: 'Faltan piezas para evaluar esta regla' };

    const valorOrigen = origen[regla.atributoOrigen];
    const valorDestino = destino[regla.atributoDestino];
    if (valorOrigen === null || valorOrigen === undefined || valorDestino === null || valorDestino === undefined) {
      return { ...base, cumple: true, omitida: true, detalle: 'Faltan datos técnicos para evaluar esta regla' };
    }

    let cumple: boolean;
    let textoOk: string;
    switch (regla.tipo) {
      case 'igual':
        cumple = valorOrigen === valorDestino;
        textoOk = `${valorOrigen} = ${valorDestino}`;
        break;
      case 'contiene':
        cumple = lista(valorDestino).includes(String(valorOrigen));
        textoOk = `${valorOrigen} está entre ${lista(valorDestino).join(', ')}`;
        break;
      case 'menor_igual':
        cumple = Number(valorOrigen) <= Number(valorDestino);
        textoOk = `${valorOrigen} ≤ ${valorDestino}`;
        break;
      default:
        return { ...base, cumple: true, omitida: true, detalle: `Tipo de regla desconocido: ${regla.tipo}` };
    }

    return { ...base, cumple, omitida: false, detalle: cumple ? textoOk : this.formatear(regla.mensajeError, valorOrigen, valorDestino) };
  }

  // Reemplaza {origen} y {destino} dentro del mensaje guardado en la base de datos
  private formatear(mensaje: string, origen: any, destino: any) {
    const texto = (v: any) => String(v).replace(/,/g, ', ');
    return mensaje.replace('{origen}', texto(origen)).replace('{destino}', texto(destino));
  }
}
