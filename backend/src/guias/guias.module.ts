import { Controller, Get, Injectable, Module, NotFoundException, Param } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Repository } from 'typeorm';
import { Guia } from './guia.entity';

@Injectable()
export class GuiasService {
  constructor(@InjectRepository(Guia) private readonly repo: Repository<Guia>) {}

  // El listado no trae el contenido completo (es más liviano)
  listar() {
    return this.repo.find({
      select: ['id', 'slug', 'titulo', 'etiquetas', 'resumen', 'minutosLectura', 'imagenUrl', 'imagenCredito', 'fecha'],
      order: { id: 'ASC' },
    });
  }

  async obtener(slug: string) {
    const guia = await this.repo.findOne({ where: { slug } });
    if (!guia) throw new NotFoundException('Esa guía no existe');
    const otras = (await this.listar()).filter((g) => g.slug !== slug).slice(0, 3);
    return { ...guia, otras };
  }

  async guardarTodas(guias: Partial<Guia>[]) {
    await this.repo.save(guias.map((g) => this.repo.create(g)));
  }
}

@ApiTags('Guías')
@Controller('api/guias')
export class GuiasController {
  constructor(private readonly guias: GuiasService) {}

  @Get()
  @ApiOperation({ summary: 'Listado de guías' })
  listar() {
    return this.guias.listar();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Guía completa' })
  obtener(@Param('slug') slug: string) {
    return this.guias.obtener(slug);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Guia])],
  providers: [GuiasService],
  controllers: [GuiasController],
  exports: [GuiasService],
})
export class GuiasModule {}
