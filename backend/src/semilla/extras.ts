import { Componente } from '../componentes/componente.entity';
import { FOTOS, FOTO_CATEGORIA, Foto } from './imagenes';

// Texto con el que se busca cada componente en las tiendas (si falta, se usa el nombre)
export const BUSQUEDAS: Record<string, string> = {
  'Wraith Stealth': 'Wraith Stealth',
  AK400: 'AK400',
  'Peerless Assassin 120 SE': 'Peerless Assassin',
  'NH-D15 G2': 'NH-D15',
  'Liquid Freezer III 240': 'Liquid Freezer III',
  'Kraken 360': 'Kraken 360',
  'A520M-A Pro': 'A520M-A',
  'B550 Tomahawk': 'B550 Tomahawk',
  'PRO B760M-A DDR4': 'B760M-A',
  'ROG Strix Z790-E': 'Z790-E',
  'TUF Gaming Z890-Plus': 'Z890-PLUS',
  'PRO B650M-A WiFi': 'B650M-A',
  'TUF Gaming B650-Plus': 'B650-PLUS',
  'ROG Strix B650E-I': 'B650E-I',
  'X870 Aorus Elite': 'X870 AORUS',
  'Fury Beast 16 GB DDR4 3200': 'Fury Beast DDR4',
  'Vengeance 32 GB DDR4 3600': 'Vengeance DDR4',
  'Vengeance 16 GB DDR5 5600': 'Vengeance DDR5',
  'Fury Beast 32 GB DDR5 6000': 'Fury Beast DDR5',
  'Trident Z5 64 GB DDR5 6400': 'Trident Z5',
  'MX500 1 TB': 'MX500',
  'NV2 1 TB': 'NV2',
  'P3 Plus 2 TB': 'P3 Plus',
  'WD Black SN850X 1 TB': 'SN850X',
  '990 Pro 2 TB': '990 PRO',
  'T700 2 TB': 'T700',
  '500 W1': 'EVGA 500',
  CX650M: 'CX650M',
  'MAG A750GL': 'A750GL',
  RM850x: 'RM850x',
  'Focus GX-1000': 'GX-1000',
  HX1500i: 'HX1500i',
  'Versa H18': 'Versa H18',
  'Air 100 ARGB': 'Air 100',
  NR200P: 'NR200P',
  'H5 Flow': 'H5 Flow',
  '4000D Airflow': '4000D',
  'Lancool 216': 'Lancool 216',
  North: 'Fractal North',
  'O11 Dynamic EVO': 'O11 Dynamic',
  'TUF Gaming VG249Q3A': 'VG249Q3A',
  'UltraGear 27GS65F': '27GS65F',
  'Odyssey G5 27': 'Odyssey G5',
  'MAG 274QRF QD E2': '274QRF',
  'ROG Swift PG27AQDM': 'PG27AQDM',
  'Cobra M711': 'Cobra M711',
  'G203 Lightsync': 'G203',
  'G502 HERO': 'G502',
  'DeathAdder V3': 'DeathAdder V3',
  'Pro X Superlight 2': 'Superlight 2',
  'Kumara K552': 'Kumara',
  'G213 Prodigy': 'G213',
  'Alloy Origins Core': 'Alloy Origins Core',
  'BlackWidow V4': 'BlackWidow V4',
  'G Pro X TKL': 'Pro X TKL',
  'Pebble V3': 'Pebble V3',
  Z313: 'Z313',
  R1280T: 'R1280T',
  Z623: 'Z623',
};

// Elige la foto de referencia más parecida al modelo
export function fotoPara(c: Partial<Componente> & { cat?: string }): Foto {
  const n = `${c.marca} ${c.nombre}`.toLowerCase();
  const codigo = c.cat ?? c.categoria?.codigo;
  switch (codigo) {
    case 'CPU':
      if (n.includes('intel')) return /i[79]|ultra/.test(n) ? FOTOS.intelRaptor : FOTOS.intel;
      if (c.zocalo === 'AM4') return FOTOS.ryzenAm4;
      return /\b9\d{3}x/.test(n) ? FOTOS.ryzen9000 : FOTOS.ryzen7000;
    case 'GPU':
      if (n.includes('5090')) return FOTOS.rtx5090;
      if (/rtx 50/.test(n)) return FOTOS.rtx50;
      if (n.includes('gtx')) return FOTOS.gtx;
      if (n.includes('9070')) return FOTOS.rx9070;
      if (n.includes('radeon')) return FOTOS.radeon;
      return FOTOS.nvidia;
    case 'RAM':
      return c.tipoMemoria === 'DDR4' ? FOTOS.ddr4 : n.includes('g.skill') ? FOTOS.ramRoja : FOTOS.ddr5;
    case 'ALMAC':
      if (n.includes('samsung')) return FOTOS.ssdSamsung;
      if (n.includes('nv2')) return FOTOS.kingstonNv2;
      if (n.includes('crucial') && !n.includes('mx500')) return FOTOS.crucialP3;
      if (n.includes('mx500')) return FOTOS.sata;
      return FOTOS.nvme;
    case 'FUENTE':
      if (n.includes('msi')) return FOTOS.fuenteMsi;
      if (n.includes('cx')) return FOTOS.fuenteCorsair;
      if (n.includes('evga')) return FOTOS.fuenteBasica;
      return FOTOS.fuenteModular;
    case 'CAJA':
      if (n.includes('4000d')) return FOTOS.caja4000d;
      if (n.includes('o11')) return FOTOS.cajaO11;
      if (/argb|lancool/.test(n)) return FOTOS.cajaRgb;
      return FOTOS.cajaAtx;
    case 'REFRIG':
      if (n.includes('wraith')) return FOTOS.wraith;
      if (n.includes('ak400')) return FOTOS.ak400;
      if (n.includes('kraken')) return FOTOS.kraken;
      if (n.includes('freezer')) return FOTOS.aio240;
      if (n.includes('peerless')) return FOTOS.torre;
      return FOTOS.nhd15;
    case 'PLACA':
      if (n.includes('msi')) return FOTOS.placaMsi;
      if (n.includes('tuf')) return FOTOS.placaTuf;
      if (n.includes('gigabyte')) return FOTOS.placaBlanca;
      return FOTOS.placaRog;
    case 'MONITOR':
      if (/odyssey|curvo/.test(n)) return FOTOS.monitorCurvo;
      if (n.includes('lg')) return FOTOS.monitorLg;
      return /rog|tuf/.test(n) ? FOTOS.monitorCurvo : FOTOS.monitor27;
    case 'RATON':
      if (n.includes('razer')) return FOTOS.ratonRazer;
      if (n.includes('superlight')) return FOTOS.ratonPro;
      if (n.includes('g502')) return FOTOS.ratonG502;
      return FOTOS.ratonG903;
    case 'TECLADO':
      if (n.includes('razer')) return FOTOS.tecladoRazer;
      if (n.includes('logitech')) return FOTOS.tecladoLogitech;
      return FOTOS.tecladoMecanico;
    case 'ALTAVOZ':
      if (n.includes('z623') || n.includes('z313')) return FOTOS.parlantesLogitech;
      if (n.includes('edifier')) return FOTOS.parlantesBose;
      return FOTOS.parlantesUsb;
  }
  return FOTO_CATEGORIA[codigo] ?? FOTOS.ryzen7000;
}
