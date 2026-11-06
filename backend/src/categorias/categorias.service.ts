import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './categoria.entity';

@Injectable()
export class CategoriasService {
  constructor(@InjectRepository(Categoria) private readonly repo: Repository<Categoria>) {}

  listar() {
    return this.repo.find({ order: { orden: 'ASC' } });
  }

  async obtener(codigo: string) {
    const categoria = await this.repo.findOne({ where: { codigo: String(codigo).toUpperCase() } });
    if (!categoria) throw new NotFoundException('Esa categoría no existe');
    return categoria;
  }

  listarConComponentes() {
    return this.repo.find({
      relations: { componentes: true },
      order: { orden: 'ASC', componentes: { precio: 'ASC' } },
    });
  }
}
