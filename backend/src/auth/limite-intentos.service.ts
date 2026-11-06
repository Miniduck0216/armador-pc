import { Injectable } from '@nestjs/common';

const MAX_FALLOS = 5;
const BLOQUEO_MS = 5 * 60 * 1000; // 5 minutos

interface Registro {
  fallos: number;
  bloqueadoHasta?: number;
}

// Protección contra ataques de fuerza bruta: después de 5 intentos fallidos
// con el mismo correo desde la misma dirección, se bloquea el ingreso 5 minutos.
@Injectable()
export class LimiteIntentosService {
  private readonly registros = new Map<string, Registro>();

  private clave(correo: string, ip: string) {
    return `${(correo || '').toLowerCase()}|${ip}`;
  }

  minutosRestantes(correo: string, ip: string): number {
    const r = this.registros.get(this.clave(correo, ip));
    if (!r?.bloqueadoHasta) return 0;
    const restante = r.bloqueadoHasta - Date.now();
    if (restante <= 0) {
      this.registros.delete(this.clave(correo, ip));
      return 0;
    }
    return Math.ceil(restante / 60000);
  }

  registrarFallo(correo: string, ip: string) {
    const clave = this.clave(correo, ip);
    const r = this.registros.get(clave) ?? { fallos: 0 };
    r.fallos++;
    if (r.fallos >= MAX_FALLOS) r.bloqueadoHasta = Date.now() + BLOQUEO_MS;
    this.registros.set(clave, r);
    return MAX_FALLOS - r.fallos;
  }

  limpiar(correo: string, ip: string) {
    this.registros.delete(this.clave(correo, ip));
  }
}
