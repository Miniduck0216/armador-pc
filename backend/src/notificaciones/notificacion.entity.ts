import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';

// Aviso que aparece en la campana del usuario (por ejemplo: "Tu armado fue aprobado")
@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  usuario: Usuario;

  @Column()
  mensaje: string;

  // Página a la que lleva el aviso (siempre una ruta interna)
  @Column({ default: '' })
  enlace: string;

  @Column({ default: false })
  vista: boolean;

  @CreateDateColumn()
  fecha: Date;
}
