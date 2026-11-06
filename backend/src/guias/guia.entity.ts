import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Artículo de ayuda para elegir componentes
@Entity('guias')
export class Guia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column()
  titulo: string;

  @Column()
  etiquetas: string; // "Guía, Actualidad"

  @Column()
  resumen: string;

  // Contenido en HTML sencillo (párrafos, subtítulos y listas)
  @Column('text')
  contenido: string;

  @Column({ default: 4 })
  minutosLectura: number;

  @Column({ nullable: true })
  imagenUrl: string;

  @Column({ nullable: true })
  imagenCredito: string;

  // Herramienta o página relacionada a la que invita al final
  @Column({ nullable: true })
  enlaceAccion: string;

  @Column({ nullable: true })
  textoAccion: string;

  @CreateDateColumn()
  fecha: Date;
}
