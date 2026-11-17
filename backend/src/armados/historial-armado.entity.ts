import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Armado } from './armado.entity';
import { Usuario } from '../usuarios/usuario.entity';

// Cada cambio de estado de un armado queda registrado: quién, cuándo y por qué
@Entity('historial_armados')
export class HistorialArmado {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Armado, { onDelete: 'CASCADE' })
  armado: Armado;

  @ManyToOne(() => Usuario, { eager: true, nullable: true, onDelete: 'SET NULL' })
  usuario: Usuario | null;

  @Column()
  estadoAnterior: string;

  @Column()
  estadoNuevo: string;

  @Column({ type: 'varchar', nullable: true })
  comentario: string | null;

  @CreateDateColumn()
  fecha: Date;
}
