import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReglaCompatibilidad } from './regla-compatibilidad.entity';

@Injectable()
export class ReglasService {
  constructor(
    @InjectRepository(ReglaCompatibilidad) private readonly repo: Repository<ReglaCompatibilidad>,
  ) {}

  listarActivas() {
    return this.repo.find({ where: { activa: true } });
  }

  listar() {
    return this.repo.find();
  }
}
