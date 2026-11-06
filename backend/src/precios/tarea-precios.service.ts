import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertasService } from './alertas.service';
import { PROVEEDOR_PRECIOS, ProveedorPrecios } from './proveedor-precios';
import { SincronizadorService } from './sincronizador.service';
import { Tienda } from './entidades/tienda.entity';

// Modo de precios:
//  - "real" (por defecto): precios de tiendas reales de Ecuador y de las APIs configuradas.
//  - "demo": tiendas ficticias con precios simulados (sirve sin internet, para presentar).
export const MODO_PRECIOS: 'real' | 'demo' = process.env.PRECIOS_MODO === 'demo' ? 'demo' : 'real';

export interface EstadoTarea {
  modo: 'real' | 'demo';
  enCurso: boolean;
  inicio: Date | null;
  fin: Date | null;
  resultado: any;
  error: string | null;
}

@Injectable()
export class TareaPreciosService {
  private readonly log = new Logger('TareaPrecios');
  readonly estado: EstadoTarea = { modo: MODO_PRECIOS, enCurso: false, inicio: null, fin: null, resultado: null, error: null };

  constructor(
    @Inject(PROVEEDOR_PRECIOS) private readonly simulador: ProveedorPrecios,
    private readonly sincronizador: SincronizadorService,
    private readonly alertas: AlertasService,
    @InjectRepository(Tienda) private readonly tiendas: Repository<Tienda>,
  ) {}

  // Activa las tiendas que corresponden al modo elegido
  async aplicarModo() {
    const demo = MODO_PRECIOS === 'demo';
    await this.tiendas.createQueryBuilder().update().set({ activa: demo }).where('fuente = :f', { f: 'simulada' }).execute();
    await this.tiendas.createQueryBuilder().update().set({ activa: !demo }).where('fuente = :f', { f: 'woocommerce' }).execute();
    // Las tiendas por API con claves solo se activan si las claves están configuradas
    const claves = {
      aliexpress: !!(process.env.ALIEXPRESS_APP_KEY && process.env.ALIEXPRESS_APP_SECRET && process.env.ALIEXPRESS_TRACKING_ID),
      mercadolibre: !!(process.env.MERCADOLIBRE_CLIENT_ID && process.env.MERCADOLIBRE_CLIENT_SECRET),
    };
    for (const [fuente, tiene] of Object.entries(claves)) {
      await this.tiendas.createQueryBuilder().update().set({ activa: !demo && tiene }).where('fuente = :f', { f: fuente }).execute();
    }
    this.log.log(demo ? 'Modo demostración: tiendas ficticias con precios simulados' : 'Modo real: precios de tiendas de Ecuador');
  }

  // Real: cada 6 horas (para no cargar a las tiendas). Demo: cada hora.
  @Cron(CronExpression.EVERY_6_HOURS)
  async programadaReal() {
    if (MODO_PRECIOS === 'real' && process.env.PRECIOS_AUTOMATICOS !== 'no') await this.ejecutar();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async programadaDemo() {
    if (MODO_PRECIOS === 'demo' && process.env.PRECIOS_AUTOMATICOS !== 'no') await this.ejecutar();
  }

  // Lanza la actualización sin esperar a que termine (para no bloquear el arranque o una petición)
  enSegundoPlano() {
    this.ejecutar().catch(() => undefined);
  }

  async ejecutar() {
    if (this.estado.enCurso) return null;
    Object.assign(this.estado, { enCurso: true, inicio: new Date(), fin: null, error: null });
    try {
      const resultado = MODO_PRECIOS === 'demo' ? await this.simulador.actualizar() : await this.sincronizador.sincronizar();
      const alertas = await this.alertas.revisar();
      this.estado.resultado = { ...resultado, alertasDisparadas: alertas };
      return this.estado.resultado;
    } catch (e) {
      this.estado.error = e.message;
      this.log.error(`No se pudieron actualizar los precios: ${e.message}`);
      return null;
    } finally {
      this.estado.enCurso = false;
      this.estado.fin = new Date();
    }
  }
}
