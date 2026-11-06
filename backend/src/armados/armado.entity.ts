import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Componente } from '../componentes/componente.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('armados')
export class Armado {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @CreateDateColumn()
  fechaCreacion: Date;

  @Column('real', { default: 0 })
  precioTotal: number;

  @Column({ default: 0 })
  consumoTotal: number;

  @Column({ default: 0 })
  puntajeTotal: number;

  @Column({ default: false })
  esCompatible: boolean;

  // Enlace público para compartir (null = no compartido)
  @Column({ type: 'varchar', nullable: true, unique: true })
  tokenPublico: string | null;

  // Dueño del armado: cada usuario solo ve los suyos
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE', eager: true })
  usuario: Usuario;

  // Relación muchos a muchos: genera la tabla intermedia armado_componentes
  @ManyToMany(() => Componente, { eager: true })
  @JoinTable({
    name: 'armado_componentes',
    joinColumn: { name: 'armadoId' },
    inverseJoinColumn: { name: 'componenteId' },
  })
  componentes: Componente[];
}
