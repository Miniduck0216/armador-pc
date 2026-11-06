import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Usuario } from '../../usuarios/usuario.entity';
import { Componente } from '../../componentes/componente.entity';

// El usuario pide que se le avise cuando un componente baje de cierto precio
@Entity('alertas_precio')
@Unique(['usuario', 'componente'])
export class AlertaPrecio {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  usuario: Usuario;

  @ManyToOne(() => Componente, { eager: true, onDelete: 'CASCADE' })
  componente: Componente;

  @Column('real')
  precioObjetivo: number;

  // Precio que tenía cuando se creó la alerta (para mostrar cuánto bajó)
  @Column('real')
  precioInicial: number;

  @Column({ default: false })
  disparada: boolean;

  @Column('real', { nullable: true })
  precioAlcanzado: number;

  @Column({ type: 'datetime', nullable: true })
  fechaDisparo: Date;

  // El usuario ya vio la notificación
  @Column({ default: false })
  vista: boolean;

  @CreateDateColumn()
  fechaCreacion: Date;
}
