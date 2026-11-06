import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Componente } from '../../componentes/componente.entity';
import { Tienda } from './tienda.entity';
import { HistorialPrecio } from './historial-precio.entity';

// Precio actual de un componente en una tienda (una oferta por componente y tienda)
@Entity('ofertas')
@Unique(['componente', 'tienda'])
export class Oferta {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Componente, (c) => c.ofertas, { onDelete: 'CASCADE' })
  componente: Componente;

  @ManyToOne(() => Tienda, (t) => t.ofertas, { eager: true, onDelete: 'CASCADE' })
  tienda: Tienda;

  @Column('real')
  precio: number;

  @Column({ default: true })
  enStock: boolean;

  // Enlace al producto en la tienda
  @Column()
  url: string;

  // Cómo se llama el producto en la tienda (sirve para revisar el emparejamiento)
  @Column({ nullable: true })
  tituloTienda: string;

  @Column({ nullable: true })
  imagenUrl: string;

  @Column({ nullable: true })
  idExterno: string;

  @Column({ type: 'datetime' })
  actualizado: Date;

  @OneToMany(() => HistorialPrecio, (h) => h.oferta)
  historial: HistorialPrecio[];
}
