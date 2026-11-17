import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Usuario } from './usuario.entity';
import { Permiso } from './permiso.entity';

// Ajuste de UN permiso para UNA persona, por encima de lo que diga su rol:
//   concedido = true  → se le da aunque su rol no lo tenga
//   concedido = false → se le quita aunque su rol lo tenga
// Si no hay fila para ese permiso, la persona usa lo de su rol.
@Entity('usuarios_permisos')
@Unique(['usuario', 'permiso'])
export class PermisoUsuario {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, (u) => u.ajustesPermisos, { onDelete: 'CASCADE' })
  usuario: Usuario;

  @ManyToOne(() => Permiso, { eager: true, onDelete: 'CASCADE' })
  permiso: Permiso;

  @Column()
  concedido: boolean;
}
