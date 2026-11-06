import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { Componente } from '../componentes/componente.entity';

// Opinión de un usuario sobre un componente (una por usuario y componente)
@Entity('resenas')
@Unique(['usuario', 'componente'])
export class Resena {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, { eager: true, onDelete: 'CASCADE' })
  usuario: Usuario;

  @ManyToOne(() => Componente, { onDelete: 'CASCADE' })
  componente: Componente;

  @Column()
  calificacion: number; // 1 a 5

  @Column({ length: 500 })
  comentario: string;

  @CreateDateColumn()
  fecha: Date;
}

// Aviso de un dato incorrecto que el administrador revisa
@Entity('reportes')
export class Reporte {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, { eager: true, onDelete: 'CASCADE' })
  usuario: Usuario;

  @ManyToOne(() => Componente, { eager: true, onDelete: 'CASCADE' })
  componente: Componente;

  @Column({ length: 300 })
  mensaje: string;

  @Column({ default: 'pendiente' })
  estado: 'pendiente' | 'resuelto';

  @CreateDateColumn()
  fecha: Date;
}

// Comparación que el usuario guarda para revisarla después
@Entity('comparaciones_guardadas')
@Unique(['usuario', 'componenteA', 'componenteB'])
export class ComparacionGuardada {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  usuario: Usuario;

  @ManyToOne(() => Componente, { eager: true, onDelete: 'CASCADE' })
  componenteA: Componente;

  @ManyToOne(() => Componente, { eager: true, onDelete: 'CASCADE' })
  componenteB: Componente;

  @CreateDateColumn()
  fecha: Date;
}
