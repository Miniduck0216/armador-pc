import { Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Categoria } from '../categorias/categoria.entity';
import { EspecificacionCpu } from '../procesadores/especificacion-cpu.entity';
import { Oferta } from '../precios/entidades/oferta.entity';

// Pieza de computadora. Las columnas técnicas son opcionales porque cada categoría
// usa solo algunas; las que intervienen en reglas de compatibilidad son columnas
// propias y el resto de datos descriptivos vive en "atributos" (JSON).
@Entity('componentes')
export class Componente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  marca: string;

  // Precio de referencia (sugerido por el fabricante). El precio real sale de las ofertas.
  @Column('real')
  precio: number;

  // Consumo eléctrico estimado en vatios
  @Column({ default: 0 })
  consumoW: number;

  // Puntaje de rendimiento relativo (0 a 100)
  @Column({ default: 0 })
  puntajeRendimiento: number;

  // ---- Atributos que usan las reglas de compatibilidad ----
  @Column({ nullable: true })
  zocalo: string; // CPU y placa: AM5, AM4, LGA1700...

  @Column({ nullable: true })
  tipoMemoria: string; // placa y RAM: DDR4 o DDR5; CPU: DDR4/DDR5

  @Column({ nullable: true })
  potenciaW: number; // fuente

  @Column({ nullable: true })
  formato: string; // placa: ATX, mATX, ITX

  @Column({ nullable: true })
  formatosSoportados: string; // caja: "ATX,mATX,ITX"

  @Column({ nullable: true })
  longitudMm: number; // tarjeta gráfica

  @Column({ nullable: true })
  longitudMaxGpuMm: number; // caja

  @Column({ nullable: true })
  zocalosSoportados: string; // refrigeración: "AM4,AM5,LGA1700"

  @Column({ nullable: true })
  capacidadTermicaW: number; // refrigeración: calor que puede disipar

  // Imagen de referencia (foto real con licencia libre de Wikimedia Commons)
  @Column({ nullable: true })
  imagenUrl: string;

  @Column({ nullable: true })
  imagenCredito: string; // "Foto: autor · licencia · Wikimedia Commons"

  // Foto exacta del producto tomada de la tienda donde se encontró (tiene prioridad)
  @Column({ nullable: true })
  imagenTienda: string;

  @Column({ nullable: true })
  imagenTiendaOrigen: string; // nombre de la tienda de la que viene la foto

  // Texto que se usa para buscar el producto en las tiendas ("RTX 5070 Ti")
  @Column({ nullable: true })
  busqueda: string;

  // Datos descriptivos para la ficha: { "Capacidad": "1 TB", "Interfaz": "PCIe 4.0" }
  @Column('simple-json', { nullable: true })
  atributos: Record<string, string>;

  @ManyToOne(() => Categoria, (c) => c.componentes, { eager: true })
  categoria: Categoria;

  // Solo los procesadores tienen ficha técnica detallada
  @OneToOne(() => EspecificacionCpu, (e) => e.componente)
  especificacion: EspecificacionCpu;

  @OneToMany(() => Oferta, (o) => o.componente)
  ofertas: Oferta[];
}
