// Utilidades de fecha en formato AAAA-MM-DD según la hora local del servidor

export function diaLocal(fecha = new Date()): string {
  return fecha.toLocaleDateString('sv-SE'); // el formato sueco es AAAA-MM-DD
}

export function sumarDias(dia: string, dias: number): string {
  const [a, m, d] = dia.split('-').map(Number);
  return diaLocal(new Date(a, m - 1, d + dias));
}

export function diasEntre(desde: string, hasta: string): number {
  const ms = new Date(hasta + 'T00:00:00').getTime() - new Date(desde + 'T00:00:00').getTime();
  return Math.round(ms / 86400000);
}
