import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Componente } from '../componentes/componente.entity';
import { Rol } from './rol.entity';

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

  // Llave foránea hacia la tabla roles (el rol trae sus permisos)
  @ManyToOne(() => Rol, { eager: true, nullable: true })
  @JoinColumn({ name: 'rolId' })
  rol: Rol | null;

  // Columna antigua donde el rol se guardaba como texto. Solo se lee una vez al
  // arrancar para pasar esos usuarios a la tabla roles (ver RolesService.asegurar).
  @Column({ name: 'rol', type: 'varchar', nullable: true, select: false })
  rolAnterior: string | null;

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
