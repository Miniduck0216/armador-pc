import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Componente } from './componente.entity';

@Injectable()
export class ComponentesService {
  constructor(@InjectRepository(Componente) private readonly repo: Repository<Componente>) {}

  listar(codigoCategoria?: string) {
    return this.repo.find({
      where: codigoCategoria ? { categoria: { codigo: codigoCategoria } } : {},
      order: { categoria: { orden: 'ASC' }, precio: 'ASC' },
    });
  }

  buscarPorIds(ids: number[]) {
    if (!ids.length) return Promise.resolve([] as Componente[]);
    return this.repo.find({ where: { id: In(ids) } });
  }

  async obtener(id: number) {
    const componente = await this.repo.findOne({ where: { id }, relations: { especificacion: true } });
    if (!componente) throw new NotFoundException('Ese componente no existe');
    return componente;
  }

  // Cantidad de componentes por categoría: { CPU: 16, GPU: 12, ... }
  async contarPorCategoria(): Promise<Record<string, number>> {
    const filas = await this.repo
      .createQueryBuilder('c')
      .innerJoin('c.categoria', 'cat')
      .select('cat.codigo', 'codigo')
      .addSelect('COUNT(*)', 'total')
      .groupBy('cat.codigo')
      .getRawMany();
    return Object.fromEntries(filas.map((f) => [f.codigo, Number(f.total)]));
  }

  contar() {
    return this.repo.count();
  }
}
