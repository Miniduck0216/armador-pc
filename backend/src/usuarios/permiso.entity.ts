import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Acción concreta que se puede permitir a un rol, por ejemplo "precios.gestionar".
// El catálogo lo define el sistema (permisos.ts); no se crean permisos desde la interfaz.
@Entity('permisos')
export class Permiso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  codigo: string;

  @Column()
  nombre: string;

  // Agrupa los permisos en la pantalla de roles (Catálogo, Precios, Usuarios...)
  @Column()
  modulo: string;
}
