import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Componente } from '../componentes/componente.entity';

export type Rol = 'usuario' | 'admin';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ unique: true })
  correo: string;

  // Nunca se guarda la contraseña en texto plano, solo su resumen con bcrypt
  @Column({ select: false })
  contrasenaHash: string;

  @Column({ default: 'usuario' })
  rol: Rol;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  fechaRegistro: Date;

  @Column({ type: 'datetime', nullable: true })
  ultimoIngreso: Date;

  // Procesadores u otras piezas marcadas como favoritas
  @ManyToMany(() => Componente)
  @JoinTable({ name: 'favoritos', joinColumn: { name: 'usuarioId' }, inverseJoinColumn: { name: 'componenteId' } })
  favoritos: Componente[];
}
