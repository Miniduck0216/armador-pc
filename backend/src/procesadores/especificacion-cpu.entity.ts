import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Componente } from '../componentes/componente.entity';

// Ficha técnica de un procesador. Relación uno a uno con Componente:
// el componente guarda lo común (nombre, marca, precio, zócalo) y esta tabla lo específico.
@Entity('especificaciones_cpu')
export class EspecificacionCpu {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Componente, (c) => c.especificacion, { onDelete: 'CASCADE' })
  @JoinColumn()
  componente: Componente;

  @Column()
  nucleos: number;

  @Column()
  hilos: number;

  @Column('real')
  frecuenciaBase: number; // GHz

  @Column('real')
  frecuenciaTurbo: number; // GHz

  @Column()
  cacheL3: number; // MB

  @Column()
  tdp: number; // W

  @Column()
  litografia: number; // nm

  @Column()
  anioLanzamiento: number;

  @Column({ default: false })
  graficosIntegrados: boolean;

  @Column({ nullable: true })
  nombreGraficos: string;

  @Column()
  memoriaSoportada: string; // DDR4, DDR5 o DDR4/DDR5

  @Column()
  velocidadMemoriaMax: number; // MHz

  @Column('real')
  versionPcie: number; // 4 o 5

  @Column({ default: false })
  desbloqueado: boolean; // permite overclock

  // Pruebas de rendimiento (valores aproximados de Cinebench R23)
  @Column()
  cinebenchMono: number;

  @Column()
  cinebenchMulti: number;
}
