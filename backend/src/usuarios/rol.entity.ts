import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Permiso } from './permiso.entity';

// Rol de un usuario (Administrador, Técnico, Usuario...). Cada rol tiene varios permisos
// y cada permiso puede estar en varios roles: relación muchos a muchos (tabla roles_permisos).
@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn()
  id: number;

  // Identificador corto y fijo: admin, tecnico, usuario...
  @Column({ unique: true })
  codigo: string;

  @Column()
  nombre: string;

  @Column({ default: '' })
  descripcion: string;

  // Los roles del sistema no se pueden eliminar
  @Column({ default: false })
  sistema: boolean;

  @ManyToMany(() => Permiso, { eager: true })
  @JoinTable({ name: 'roles_permisos', joinColumn: { name: 'rolId' }, inverseJoinColumn: { name: 'permisoId' } })
  permisos: Permiso[];
}
