import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Oferta } from './oferta.entity';

export type FuenteTienda = 'woocommerce' | 'aliexpress' | 'mercadolibre' | 'simulada';

// Tienda donde se vende un componente. Las tiendas reales de Ecuador se consultan
// por su API pública (WooCommerce); las "simuladas" solo se usan en modo demostración.
@Entity('tiendas')
export class Tienda {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column()
  sitioWeb: string;

  @Column({ default: 'simulada' })
  fuente: FuenteTienda;

  @Column({ default: 'Ecuador' })
  pais: string;

  @Column({ default: '' })
  ciudad: string;

  // null = se detecta solo leyendo el texto del precio ("incluido IVA" / "+ IVA")
  @Column({ nullable: true })
  ivaIncluido: boolean;

  @Column({ type: 'datetime', nullable: true })
  ultimaSincronizacion: Date;

  @Column({ nullable: true })
  ultimoError: string;

  // Color de la marca para el distintivo visual de la tienda
  @Column({ default: '#4cc3ff' })
  color: string;

  @Column('real', { default: 0 })
  costoEnvio: number;

  @Column({ default: 3 })
  diasEntrega: number;

  // Calificación de la tienda (1 a 5)
  @Column('real', { default: 4 })
  valoracion: number;

  @Column({ default: true })
  activa: boolean;

  @OneToMany(() => Oferta, (o) => o.tienda)
  ofertas: Oferta[];
}
