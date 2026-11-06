import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Oferta } from './oferta.entity';

// Un registro por oferta y por día: permite dibujar la evolución del precio
@Entity('historial_precios')
@Unique(['oferta', 'fecha'])
export class HistorialPrecio {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Oferta, (o) => o.historial, { onDelete: 'CASCADE' })
  oferta: Oferta;

  // Día en formato AAAA-MM-DD
  @Index()
  @Column({ length: 10 })
  fecha: string;

  @Column('real')
  precio: number;
}
