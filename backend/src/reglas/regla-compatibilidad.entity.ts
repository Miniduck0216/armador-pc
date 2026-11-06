import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Tipos de regla soportados por el motor de compatibilidad:
//  - igual:        el atributo de origen debe ser igual al de destino
//  - contiene:     el valor de origen debe estar en la lista de destino ("AM4,AM5" o "DDR4/DDR5")
//  - menor_igual:  el valor de origen debe ser menor o igual al de destino
//  - suma_consumo: la potencia de la fuente debe cubrir la suma del consumo más un margen (%)
export type TipoRegla = 'igual' | 'contiene' | 'menor_igual' | 'suma_consumo';

@Entity('reglas_compatibilidad')
export class ReglaCompatibilidad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  tipo: TipoRegla;

  @Column({ nullable: true })
  categoriaOrigen: string; // código de categoría, por ejemplo CPU

  @Column({ nullable: true })
  atributoOrigen: string; // por ejemplo zocalo

  @Column()
  categoriaDestino: string;

  @Column()
  atributoDestino: string;

  // Margen adicional en porcentaje (solo para suma_consumo)
  @Column({ default: 0 })
  margen: number;

  @Column()
  mensajeError: string;

  @Column({ default: true })
  activa: boolean;
}
