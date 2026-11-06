import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type UsoConfiguracion = 'gaming' | 'creacion' | 'trabajo';

// Configuración recomendada lista para usar o personalizar en el configurador
@Entity('configuraciones')
export class Configuracion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column()
  titulo: string; // "Gaming equilibrado para 1080p"

  @Column()
  uso: UsoConfiguracion;

  @Column()
  etiqueta: string; // "Gaming · 1080p"

  @Column()
  antetitulo: string; // "Para jugar sin parar"

  @Column()
  descripcion: string;

  @Column('real')
  presupuesto: number; // presupuesto con el que se armó

  @Column({ default: false })
  recomendada: boolean;

  @Column({ nullable: true })
  imagenUrl: string;

  @Column({ nullable: true })
  imagenCredito: string;

  // Ids de las piezas (una por categoría)
  @Column('simple-json')
  piezas: number[];

  @Column({ default: 0 })
  orden: number;
}
