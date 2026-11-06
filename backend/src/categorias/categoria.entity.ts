import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Componente } from '../componentes/componente.entity';

@Entity('categorias')
export class Categoria {
  @PrimaryGeneratedColumn()
  id: number;

  // Código interno: CPU, GPU, PLACA, RAM, FUENTE, ALMAC, CAJA, REFRIG, MONITOR, RATON, TECLADO, ALTAVOZ
  @Column({ unique: true })
  codigo: string;

  @Column()
  nombre: string;

  // Nombre corto en plural para menús: "Procesadores"
  @Column({ default: '' })
  plural: string;

  @Column({ default: '' })
  descripcion: string;

  @Column({ default: '' })
  icono: string;

  // Si es obligatoria para que el armado funcione (la refrigeración y la caja pueden faltar)
  @Column({ default: true })
  obligatoria: boolean;

  @Column({ default: 0 })
  orden: number;

  // componente interno o periférico
  @Column({ default: 'componente' })
  grupo: 'componente' | 'periferico';

  // Foto representativa de la categoría
  @Column({ nullable: true })
  imagenUrl: string;

  // Qué conviene mirar al comparar (texto de ayuda)
  @Column({ default: '' })
  queMirar: string;

  @OneToMany(() => Componente, (c) => c.categoria)
  componentes: Componente[];
}
