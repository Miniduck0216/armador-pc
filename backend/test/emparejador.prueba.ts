import { coincide } from '../src/precios/fuentes/emparejador';
const casos: [string, string, string, number, number, boolean][] = [
  ['GeForce RTX 5070 Ti', 'NVIDIA', 'GPU', 750, 'Tarjeta Gráfica ASUS Prime GeForce RTX 5070 Ti 16GB GDDR7' as any, true] as any,
];
const pruebas = [
  { n: 'GeForce RTX 5070 Ti', m: 'NVIDIA', c: 'GPU', r: 750, t: 'Tarjeta Gráfica ASUS Prime GeForce RTX 5070 Ti 16GB GDDR7', p: 1450, ok: true },
  { n: 'GeForce RTX 5070', m: 'NVIDIA', c: 'GPU', r: 550, t: 'Tarjeta Gráfica ASUS Prime GeForce RTX 5070 Ti 16GB GDDR7', p: 1450, ok: false },
  { n: 'GeForce RTX 5070', m: 'NVIDIA', c: 'GPU', r: 550, t: 'TARJETA DE VIDEO MSI GEFORCE RTX 5070 12GB GDDR7 – SHADOW 2X OC EDITION', p: 968.99, ok: true },
  { n: 'GeForce RTX 5070', m: 'NVIDIA', c: 'GPU', r: 550, t: 'Laptop Gigabyte Gaming A16 | Ryzen 7 260 | 16GB DDR5 | 1TB | RTX 5070 8GB', p: 2133, ok: false },
  { n: 'GeForce RTX 5070 Ti', m: 'NVIDIA', c: 'GPU', r: 750, t: 'MSI RTX 5070Ti 16G Frieren Edition OC 16GB Tarjeta Video', p: 1810, ok: true },
  { n: 'GeForce RTX 5060 Ti 16 GB', m: 'NVIDIA', c: 'GPU', r: 430, t: 'Tarjeta Gráfica Gigabyte GeForce RTX 5060 Ti GAMING OC 8GB', p: 625, ok: false },
  { n: 'GeForce RTX 5060 Ti 16 GB', m: 'NVIDIA', c: 'GPU', r: 430, t: 'Tarjeta Gráfica Gigabyte GeForce RTX 5060 Ti GAMING OC 16GB', p: 700, ok: true },
  { n: 'Ryzen 5 5600', m: 'AMD', c: 'CPU', r: 110, t: 'Procesador Ryzen 5 5600GT AM4 3.6GHz DDR4 Wraith Stealth 6 Nucleos AMD', p: 229, ok: false },
  { n: 'Ryzen 5 5600', m: 'AMD', c: 'CPU', r: 110, t: 'Procesador AMD Ryzen 5 5600 AM4 3.5GHz 6 Núcleos', p: 140, ok: true },
  { n: 'Ryzen 9 9950X', m: 'AMD', c: 'CPU', r: 600, t: 'Procesador AMD Ryzen 9 9950X3D AM5', p: 800, ok: false },
  { n: 'Ryzen 7 7800X3D', m: 'AMD', c: 'CPU', r: 400, t: 'PROCESADOR AMD RYZEN 7 7800X3D 4.2GHZ AM5', p: 520, ok: true },
  { n: 'Core i5-13400F', m: 'Intel', c: 'CPU', r: 180, t: 'Procesador Intel Core i5-13400F 2.5GHz LGA1700', p: 230, ok: true },
  { n: 'Core i5-13400F', m: 'Intel', c: 'CPU', r: 180, t: 'Procesador Intel Core i5-13400 2.5GHz LGA1700', p: 240, ok: false },
  { n: 'Core i7-14700K', m: 'Intel', c: 'CPU', r: 380, t: 'Procesador Intel Core i7 14700KF LGA1700', p: 420, ok: false },
  { n: 'Fury Beast 32 GB DDR5 6000', m: 'Kingston', c: 'RAM', r: 100, t: 'Memoria RAM Kingston Fury Beast DDR5 32GB 6000MHz CL36', p: 140, ok: true },
  { n: 'Fury Beast 32 GB DDR5 6000', m: 'Kingston', c: 'RAM', r: 100, t: 'Memoria RAM Kingston Fury Beast DDR5 16GB 6000MHz', p: 70, ok: false },
  { n: '990 Pro 2 TB', m: 'Samsung', c: 'ALMAC', r: 170, t: 'Disco SSD Samsung 990 PRO 2TB NVMe M.2', p: 230, ok: true },
  { n: 'Radeon RX 9070 XT', m: 'AMD', c: 'GPU', r: 600, t: 'Tarjeta de video Sapphire Pulse Radeon RX 9070 16GB', p: 800, ok: false },
  { n: 'Radeon RX 9070 XT', m: 'AMD', c: 'GPU', r: 600, t: 'Tarjeta de video Sapphire Pulse Radeon RX 9070 XT 16GB', p: 900, ok: true },
  { n: 'RM850x', m: 'Corsair', c: 'FUENTE', r: 130, t: 'Fuente de poder Corsair RM850x 850W 80 Plus Gold Modular', p: 180, ok: true },
];
let fallos = 0;
for (const x of pruebas) {
  const r = coincide({ nombre: x.n, marca: x.m, categoria: x.c, precioReferencia: x.r }, x.t, x.p);
  if (r !== x.ok) { fallos++; console.log('FALLA', x.n, '|', x.t, '→', r); }
}
console.log(`${pruebas.length - fallos}/${pruebas.length} pruebas correctas`);
if (fallos) process.exit(1);

// ---- Adaptador WooCommerce con una respuesta real (Neutron PC Gamer) ----
import { WooCommerceFuente } from '../src/precios/fuentes/woocommerce.fuente';
(async () => {
  const muestra = [
    { id: 3737, name: 'Tarjeta Gr&aacute;fica ASUS Prime GeForce RTX 5070 Ti 16GB GDDR7', type: 'simple',
      permalink: 'https://neutronpcgamer.com/producto/x/', is_in_stock: true,
      prices: { price: '145000', currency_minor_unit: 2 }, price_html: '<span>$1.450,00</span> <small>incluido IVA</small>',
      images: [{ src: 'https://neutronpcgamer.com/a.png', thumbnail: 'https://neutronpcgamer.com/a-320x320.png' }] },
    { id: 2, name: 'TARJETA DE VIDEO MSI GEFORCE RTX 5070 12GB', type: 'simple', permalink: 'https://t.ec/p/2', is_in_stock: true,
      prices: { price: '96899', currency_minor_unit: 2 }, price_html: '<span>$968,99</span> <small>+ IVA</small>', images: [] },
  ];
  (globalThis as any).fetch = async () => ({ ok: true, json: async () => muestra });
  const r = await new WooCommerceFuente().buscar({ sitioWeb: 'https://neutronpcgamer.com', ivaIncluido: null } as any, 'rtx 5070');
  const bien = r[0].precio === 1450 && r[0].imagen.endsWith('320x320.png') && r[1].precio === 1114.34;
  console.log(bien ? 'Adaptador WooCommerce correcto (IVA incluido y "+ IVA" detectados)' : 'FALLA adaptador: ' + JSON.stringify(r));
  if (!bien) process.exit(1);
})();
