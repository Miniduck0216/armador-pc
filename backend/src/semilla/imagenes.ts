// Fotos reales con licencia libre, tomadas de Wikimedia Commons.
// Se enlazan con Special:FilePath, que redirige siempre al archivo correcto.
// Cuando una tienda devuelve la foto exacta del producto, esa foto tiene prioridad.

export interface Foto {
  url: string;
  credito: string;
}

function commons(archivo: string, autor: string, licencia: string): Foto {
  return {
    url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(archivo)}?width=640`,
    credito: `Foto: ${autor} · ${licencia} · Wikimedia Commons`,
  };
}

export const FOTOS = {
  // Procesadores
  intel: commons('4th Generation Intel® Core™ i7 Processor Front.jpg', 'Intel in Deutschland', 'CC BY-SA 2.0'),
  intelRaptor: commons('Intel@intel7(10nmESF)@RaptorLake@RPL(8P+16E)@i9-13900K@ES DSC05781-DSC05781.jpg', 'Fritzchens Fritz', 'CC0'),
  ryzenAm4: commons('AMD Ryzen 7 1800X.jpg', 'Brian Wong', 'CC BY-SA 2.0'),
  ryzen7000: commons('AMD@5nmCCD(6nmIOD)@Zen4@Raphael@Ryzen 7 7800X3D@100-000000910 BS 2312PGY 9LW3390030138 DSCx01.jpg', 'FritzchensFritz', 'CC0'),
  ryzen9000: commons('AMD Ryzen 9 9950X.jpg', '4300streetcar', 'CC BY 4.0'),

  // Tarjetas gráficas
  rtx5090: commons('Palit GeForce RTX 5090 Gamerock 20250530 HOF4166 RAW-Export.png', 'PantheraLeo1359531', 'CC BY 4.0'),
  rtx50: commons('PNY RTX 5070 Ti at Computex 2025.jpg', '4300streetcar', 'CC BY 4.0'),
  nvidia: commons('Gigabyte GTX 1660 Ti graphics card (51993493927).jpg', 'Chi Ho Chan', 'CC BY 2.0'),
  gtx: commons('ASUS TUF Gaming X3 Geforce GTX 1660 (cropped, edited).jpg', 'Solomon203', 'CC BY-SA 4.0'),
  rx9070: commons('Sapphire Pulse Radeon RX 9070 XT - Backplate 3.jpg', 'Chaddy', 'CC BY-SA 4.0'),
  radeon: commons('Sapphire AMD Radeon RX 7900 XTX.jpg', 'Geni', 'CC BY-SA 4.0'),

  // Memoria
  ddr5: commons('2023 Pamięci Corsair Vengeance RGB.jpg', 'Jacek Halicki', 'CC BY-SA 4.0'),
  ddr4: commons('2*8Go DDR4 Corsair - 2018-05-08.jpg', 'Bretwa', 'CC BY-SA 4.0'),
  ramRoja: commons('RAM Module (SDRAM-DDR4).jpg', 'ElooKoN', 'CC BY-SA 4.0'),

  // Almacenamiento
  ssdSamsung: commons('SAMSUNG M.2 NVMe SSD 990 PRO 4TB.jpg', 'Dinkun Chen', 'CC BY-SA 4.0'),
  nvme: commons('Samsung 980 PRO PCIe 4.0 NVMe SSD 1TB-top PNr°0915.jpg', 'D-Kuru', 'CC BY-SA 4.0'),
  kingstonNv2: commons('2023 Dysk SSD Kingston NV2 2TB.jpg', 'Jacek Halicki', 'CC BY-SA 4.0'),
  crucialP3: commons('Crucial CT20000P3PSSD8 20240302 002 OKcorr02 Kopie.jpg', 'PantheraLeo1359531', 'CC BY 4.0'),
  sata: commons('Innovation IT SSD 2.5" 1 TB SATA III TLC-7140.jpg', 'Raimond Spekking', 'CC BY-SA 4.0'),

  // Fuentes
  fuenteMsi: commons('MSI ATX desktop power supply A750GF (51994134781).jpg', 'Chi Ho Chan', 'CC BY 2.0'),
  fuenteCorsair: commons('Corsair CX600M 3 2019-05-06.jpg', 'FASTILY', 'CC BY-SA 4.0'),
  fuenteModular: commons('Full modular ATX power supply unit.jpg', 'Project Kei', 'CC BY-SA 4.0'),
  fuenteBasica: commons('Corsair VS650 (CP-9020172).jpg', 'Tey.eur', 'CC BY-SA 4.0'),

  // Cajas
  caja4000d: commons('Corsair 4000D Airflow mid-tower ATX case.tif', 'PJ', 'CC BY-SA 4.0'),
  cajaRgb: commons('PC-Gehäuse Kolink Observatory RGB Midi-Tower 20201120 DSC6134.jpg', 'PantheraLeo1359531', 'CC BY 4.0'),
  cajaO11: commons('Lian Li O11 Dynamic Evo XL (der8auer edition) HOF1974-HDR RAW-Export 000210 CENS.png', 'PantheraLeo1359531', 'CC BY 4.0'),
  cajaAtx: commons('ATX computer case - left - 2018-05-18.jpg', 'Bretwa', 'CC BY-SA 4.0'),

  // Refrigeración
  nhd15: commons('NH-D15 with black fans.jpg', 'Kaleb Kloppe', 'CC BY 2.0'),
  ak400: commons('DeepCool AK400 1.jpg', 'Qurren', 'CC BY-SA 4.0'),
  wraith: commons('AMD Wraith Spire cooler.jpg', 'Ilya Plekhanov', 'CC BY-SA 4.0'),
  aio240: commons('Corsair H100i 240mm CPU cooler. On MSI Z590 Torpedo motherboard. (51987363353).jpg', 'Chi Ho Chan', 'CC BY 2.0'),
  kraken: commons('NZXT Kraken X52 cooler in H500i.jpg', 'Saucy', 'CC BY 4.0'),
  torre: commons('Cooler Master Hyper 212 EVO - CPU Cooler with 120mm PWM Fan (RR-212E-20PK-R2).jpg', 'osman gucel', 'CC BY 2.0'),
  aio360: commons('Enermax Liqtech TR4 II 360.jpg', 'Александр Мотин', 'CC BY-SA 4.0'),

  // Placas madre
  placaMsi: commons('MSI B550 Tomahawk 19354.jpg', 'Michael Wolf', 'CC BY-SA 3.0'),
  placaRog: commons('Asus-ROG-Strix-Z390-F-Gaming-Motherboard 20201120 DSC6025.jpg', 'PantheraLeo1359531', 'CC BY 4.0'),
  placaBlanca: commons('2023 Płyta główna Asus ROG STRIX Z690-A GAMING WIFI.jpg', 'Jacek Halicki', 'CC BY-SA 4.0'),
  placaTuf: commons('ASUS TUF B450-PLUS GAMING 20181221.jpg', 'Tiia Monto', 'CC BY-SA 4.0'),

  // Periféricos
  monitorCurvo: commons('ASUS ROG Strix XG32VQR monitor.jpg', 'Evan0512', 'CC BY-SA 4.0'),
  monitor27: commons('ASUS PB278Q (PXL 20250914 223256075).jpg', 'Hayden Schiff', 'CC BY 4.0'),
  monitorLg: commons('LG UltraFine 5K Display.jpg', 'LG Electronics', 'CC BY 2.0'),
  ratonRazer: commons('Razer DeathAdder Elite-front oblique-ar 16to10-fs PNr°0465.jpg', 'D-Kuru', 'CC BY-SA 3.0 AT'),
  ratonG502: commons('Logitech-g502 (13971828117).jpg', 'Sinchen.Lin', 'CC BY 2.0'),
  ratonG903: commons('2023 Mysz komputerowa Logitech G903 Lightspeed.jpg', 'Jacek Halicki', 'CC BY-SA 4.0'),
  ratonPro: commons('2026 PRO X3 SUPERSTRIKE top view.jpg', 'Stan Lee', 'CC BY-SA 4.0'),
  tecladoLogitech: commons('Logitech G PRO TKL gaming keyboard - English (United States) layout.jpg', 'AzureSaturn', 'CC0'),
  tecladoRazer: commons('Razer Blackwidow Chroma 1 2017-01-01.jpg', 'FASTILY', 'CC BY-SA 4.0'),
  tecladoMecanico: commons('Razer BlackWidow Ultimate 2014 Elite Mechanical Gaming Keyboard.jpg', 'osman.gucel', 'CC BY 2.0'),
  parlantesLogitech: commons('Logitech computer loudspeakers.jpg', 'Ralf Roletschek', 'GFDL 1.2'),
  parlantesUsb: commons('Logitech-usb-speakers.jpg', 'Evan-Amos', 'Dominio público'),
  parlantesBose: commons('Bose Computer MusicMonitor.jpg', "Ben Stassen's", 'CC BY 2.0'),

  // Escenas para configuraciones y guías
  escenaGamingRgb: commons('Ricer gaming PC with CPU watercooler.jpg', 'Benlisquare', 'CC BY-SA 4.0'),
  escenaArmado: commons('Astaroth- Inside the Finished Build.jpg', 'bwDraco', 'CC BY-SA 2.0'),
  escenaDosMonitores: commons('Dual monitor setup in a gaming room with keyboard and mouse in focus.jpg', 'Shixart1985', 'CC BY 2.0'),
  escenaOficina: commons('New office setup (November 2020) (51379753657).jpg', 'Mack Male', 'CC BY-SA 2.0'),
  escenaOficina2: commons('Old office setup (51381254519).jpg', 'Mack Male', 'CC BY-SA 2.0'),
  escenaEdicion: commons('Video editing color keyboard with Yamaha AW4416 Recording Workstation (2014-03-01 by Ben2742) pixabay - 660070.jpg', 'Ben2742', 'CC0'),
  escenaInterior: commons('2025 Wnętrze komputera PC.jpg', 'Jacek Halicki', 'CC BY-SA 4.0'),
  escenaTorre: commons('Dllu skylake computer.jpg', 'Dllu', 'CC BY-SA 4.0'),
};

// Foto por defecto de cada categoría
export const FOTO_CATEGORIA: Record<string, Foto> = {
  CPU: FOTOS.ryzen7000,
  REFRIG: FOTOS.nhd15,
  PLACA: FOTOS.placaRog,
  RAM: FOTOS.ddr5,
  GPU: FOTOS.rtx50,
  ALMAC: FOTOS.ssdSamsung,
  FUENTE: FOTOS.fuenteModular,
  CAJA: FOTOS.caja4000d,
  MONITOR: FOTOS.monitorCurvo,
  RATON: FOTOS.ratonG502,
  TECLADO: FOTOS.tecladoLogitech,
  ALTAVOZ: FOTOS.parlantesUsb,
};
