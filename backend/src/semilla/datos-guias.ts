import { Guia } from '../guias/guia.entity';
import { FOTOS } from './imagenes';

// Guías originales escritas para el proyecto
export const GUIAS: Partial<Guia>[] = [
  {
    slug: 'como-repartir-el-presupuesto',
    titulo: 'Cómo repartir el presupuesto al armar un PC',
    etiquetas: 'Guía',
    minutosLectura: 5,
    resumen: 'Qué porcentaje dedicar a cada pieza según si vas a jugar, crear contenido o trabajar, y en qué no conviene ahorrar.',
    imagenUrl: FOTOS.escenaArmado.url,
    imagenCredito: FOTOS.escenaArmado.credito,
    enlaceAccion: '/configurador.html?modo=guiado',
    textoAccion: 'Armar mi PC con un presupuesto',
    contenido: `
<p>No existe una fórmula única, pero sí un punto de partida que funciona para la mayoría de equipos. La clave es saber <strong>para qué vas a usar el PC</strong>, porque eso decide qué pieza merece más dinero.</p>
<h2>Reparto orientativo para juegos</h2>
<ul>
  <li><strong>Tarjeta gráfica: 35-45 %.</strong> Es la que más influye en los cuadros por segundo.</li>
  <li><strong>Procesador: 18-22 %.</strong> Suficiente para no limitar a la gráfica.</li>
  <li><strong>Placa madre: 10-12 %.</strong> Que tenga el zócalo correcto y buena alimentación.</li>
  <li><strong>Memoria RAM: 6-8 %.</strong> 32 GB es lo recomendable hoy.</li>
  <li><strong>Almacenamiento: 6-8 %.</strong> Un SSD NVMe de 1 TB como mínimo.</li>
  <li><strong>Fuente: 6-8 %.</strong> Nunca la pieza más barata.</li>
  <li><strong>Caja y refrigeración: 6-10 %.</strong></li>
</ul>
<h2>Si vas a crear contenido</h2>
<p>Para edición de video, 3D o programación pesada, el <strong>procesador y la memoria</strong> suben de prioridad: más núcleos y 64 GB de RAM marcan diferencia en renderizados y en programas con muchos archivos abiertos.</p>
<h2>En qué no conviene ahorrar</h2>
<p>En la <strong>fuente de poder</strong>. Una fuente mala puede apagar el equipo en plena partida o dañar otras piezas. Busca certificación 80 Plus Bronze o Gold de una marca reconocida.</p>
<h2>Un consejo para Ecuador</h2>
<p>Los precios en las tiendas locales suelen ser más altos que los de referencia en Estados Unidos por aranceles e impuestos. Compara siempre varias tiendas y revisa si el precio incluye IVA.</p>`,
  },
  {
    slug: 'que-fuente-de-poder-necesito',
    titulo: '¿Qué fuente de poder necesita tu PC?',
    etiquetas: 'Guía, Herramientas',
    minutosLectura: 4,
    resumen: 'Cómo calcular el consumo real del equipo, cuánto margen dejar y qué significan las certificaciones 80 Plus.',
    imagenUrl: FOTOS.fuenteModular.url,
    imagenCredito: FOTOS.fuenteModular.credito,
    enlaceAccion: '/herramientas.html#fuente',
    textoAccion: 'Usar la calculadora de fuente',
    contenido: `
<p>La fuente convierte la corriente del enchufe en la energía que usan las piezas. Si se queda corta, el equipo se reinicia o se apaga cuando más lo exiges.</p>
<h2>Cómo se calcula</h2>
<p>Suma el consumo de cada pieza: el procesador y la tarjeta gráfica son casi todo el gasto; la placa, la memoria, los discos y los ventiladores suman entre 60 y 120 W más.</p>
<h2>¿Por qué dejar margen?</h2>
<ul>
  <li>Las tarjetas gráficas modernas tienen <strong>picos muy cortos</strong> por encima de su consumo nominal.</li>
  <li>Una fuente trabajando al 50-70 % de su capacidad es <strong>más eficiente y más silenciosa</strong>.</li>
  <li>Te deja espacio para cambiar de tarjeta en el futuro.</li>
</ul>
<p>Por eso recomendamos un <strong>30 % de margen</strong> sobre el consumo estimado.</p>
<h2>Certificaciones 80 Plus</h2>
<p>Indican la eficiencia: Bronze, Silver, Gold, Platinum y Titanium. Para un equipo de juegos, una <strong>80 Plus Gold</strong> es la mejor relación precio y calidad. Si tu tarjeta usa el conector 12V-2x6, busca fuentes <strong>ATX 3.0 o 3.1</strong>.</p>`,
  },
  {
    slug: 'ssd-pcie-5-vs-4',
    titulo: 'SSD PCIe 5.0 vs 4.0: ¿cuál conviene?',
    etiquetas: 'Guía, Actualidad',
    minutosLectura: 4,
    resumen: 'Diferencias reales entre ambas generaciones en juegos, temperatura, compatibilidad y precio.',
    imagenUrl: FOTOS.ssdSamsung.url,
    imagenCredito: FOTOS.ssdSamsung.credito,
    enlaceAccion: '/componentes.html?categoria=ALMAC',
    textoAccion: 'Ver unidades de almacenamiento',
    contenido: `
<p>Los SSD PCIe 5.0 duplican la velocidad secuencial de los PCIe 4.0 en las pruebas, pero eso no siempre se nota en el uso diario.</p>
<h2>En juegos</h2>
<p>Los tiempos de carga entre un buen PCIe 4.0 y un PCIe 5.0 suelen diferir en <strong>uno o dos segundos</strong>. La gran diferencia está entre un disco mecánico o SATA y cualquier NVMe.</p>
<h2>Temperatura</h2>
<p>Los PCIe 5.0 se calientan más y casi siempre necesitan el disipador de la placa madre o uno propio.</p>
<h2>Compatibilidad</h2>
<p>Un SSD PCIe 5.0 funciona en una ranura PCIe 4.0, pero a velocidad de 4.0. Revisa que tu placa tenga una ranura M.2 de quinta generación.</p>
<h2>Recomendación</h2>
<ul>
  <li><strong>Para jugar:</strong> un PCIe 4.0 de 1-2 TB es la mejor compra.</li>
  <li><strong>Para editar video 4K u 8K:</strong> el PCIe 5.0 sí ahorra tiempo al mover archivos grandes.</li>
</ul>`,
  },
  {
    slug: 'compatibilidad-antes-de-comprar',
    titulo: 'Cómo saber si los componentes de un PC son compatibles',
    etiquetas: 'Guía',
    minutosLectura: 5,
    resumen: 'Las siete comprobaciones que evitan devolver una pieza: zócalo, memoria, tamaño, largo de la tarjeta, refrigeración y potencia.',
    imagenUrl: FOTOS.escenaInterior.url,
    imagenCredito: FOTOS.escenaInterior.credito,
    enlaceAccion: '/herramientas.html#comprobador',
    textoAccion: 'Comprobar mis componentes',
    contenido: `
<p>La mayoría de errores al armar un PC vienen de unas pocas incompatibilidades. Estas son las que revisa nuestro comprobador:</p>
<ol>
  <li><strong>Zócalo del procesador y la placa.</strong> AM4, AM5, LGA1700 y LGA1851 no son intercambiables.</li>
  <li><strong>Tipo de memoria.</strong> Una placa DDR5 no acepta DDR4, y viceversa.</li>
  <li><strong>Memoria soportada por el procesador.</strong> Los procesadores AM4 solo trabajan con DDR4.</li>
  <li><strong>Tamaño de la placa y la caja.</strong> Una placa ATX no entra en una caja para mATX o ITX.</li>
  <li><strong>Largo de la tarjeta gráfica.</strong> Las tarjetas de gama alta superan los 330 mm.</li>
  <li><strong>Refrigeración.</strong> El disipador debe traer montaje para tu zócalo y disipar el calor del procesador.</li>
  <li><strong>Potencia de la fuente.</strong> Debe cubrir el consumo total con margen.</li>
</ol>
<p>Hay otros detalles que conviene mirar a mano: la altura del disipador en cajas pequeñas, la actualización de BIOS en placas antiguas y los conectores de la fuente.</p>`,
  },
  {
    slug: 'refrigeracion-aire-o-liquida',
    titulo: 'Refrigeración por aire o líquida: cuál elegir',
    etiquetas: 'Guía',
    minutosLectura: 4,
    resumen: 'Ventajas, ruido, mantenimiento y para qué procesadores tiene sentido cada opción.',
    imagenUrl: FOTOS.nhd15.url,
    imagenCredito: FOTOS.nhd15.credito,
    enlaceAccion: '/herramientas.html#refrigeracion',
    textoAccion: 'Calcular la refrigeración que necesito',
    contenido: `
<p>Las dos opciones mueven el calor del procesador hacia el aire; cambia cómo lo hacen.</p>
<h2>Aire</h2>
<ul>
  <li>Más barata y casi sin mantenimiento.</li>
  <li>Una doble torre de calidad enfría tanto como muchas líquidas de 240 mm.</li>
  <li>Ocupa altura: revisa que entre en tu caja.</li>
</ul>
<h2>Líquida (AIO)</h2>
<ul>
  <li>Mejor para procesadores que generan mucho calor durante cargas largas.</li>
  <li>Libera espacio alrededor del zócalo y se ve más limpia.</li>
  <li>Tiene una bomba que puede fallar con los años.</li>
</ul>
<h2>Regla rápida</h2>
<p>Hasta unos <strong>180 W</strong> de calor, una buena torre de aire alcanza. Entre 180 y 250 W, una doble torre o una líquida de 240 mm. Más de 250 W, una líquida de 360 mm.</p>`,
  },
  {
    slug: 'buen-momento-para-armar-un-pc',
    titulo: '¿Es buen momento para armar un PC?',
    etiquetas: 'Guía, Actualidad',
    minutosLectura: 3,
    resumen: 'Cómo usar el historial de precios y las alertas para comprar en el momento adecuado.',
    imagenUrl: FOTOS.escenaGamingRgb.url,
    imagenCredito: FOTOS.escenaGamingRgb.credito,
    enlaceAccion: '/componentes.html',
    textoAccion: 'Ver precios de componentes',
    contenido: `
<p>Los precios de las tarjetas gráficas y la memoria cambian mucho de un mes a otro. No hace falta adivinar: los datos ayudan.</p>
<h2>Mira el historial</h2>
<p>En la ficha de cada componente verás cómo cambió su mejor precio en las tiendas. Si hoy está cerca de su <strong>mínimo</strong>, es buen momento.</p>
<h2>Crea una alerta</h2>
<p>Si no tienes prisa, elige un precio objetivo y te avisaremos cuando alguna tienda llegue a él.</p>
<h2>No esperes para siempre</h2>
<p>Siempre habrá una generación nueva en camino. Si el equipo que puedes comprar hoy cubre lo que necesitas, disfrútalo; esperar meses por un 10 % de rendimiento rara vez compensa.</p>`,
  },
];
