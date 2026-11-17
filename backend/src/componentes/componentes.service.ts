import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Componente } from './componente.entity';
import { Categoria } from '../categorias/categoria.entity';
import { CAMPOS_POR_CATEGORIA, CATEGORIAS_CON_SECCION_PROPIA, COLUMNAS_TECNICAS } from './campos-categoria';
import { ComponenteAdminDto } from './dto/componente-admin.dto';

@Injectable()
export class ComponentesService {
  constructor(
    @InjectRepository(Componente) private readonly repo: Repository<Componente>,
    @InjectRepository(Categoria) private readonly categorias: Repository<Categoria>,
  ) {}

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

  // ---------- CRUD del panel ----------

  categoriasEditables() {
    return this.categorias.find({ order: { orden: 'ASC' } }).then((l) => l.filter((c) => !CATEGORIAS_CON_SECCION_PROPIA.includes(c.codigo)));
  }

  // Zócalos que existen en el catálogo de procesadores (para los desplegables)
  async zocalos(): Promise<string[]> {
    const filas = await this.repo.createQueryBuilder('c').innerJoin('c.categoria', 'cat').select('DISTINCT c.zocalo', 'z')
      .where("cat.codigo = 'CPU' AND c.zocalo IS NOT NULL").getRawMany();
    return filas.map((f) => f.z).sort();
  }

  // Valida los campos técnicos según la categoría y devuelve las columnas a guardar
  private async tecnicos(codigo: string, valores: Record<string, unknown> = {}) {
    const zocalos = await this.zocalos();
    const datos: Record<string, string | number | null> = Object.fromEntries(COLUMNAS_TECNICAS.map((c) => [c, null]));
    const errores: string[] = [];
    for (const c of CAMPOS_POR_CATEGORIA[codigo] ?? []) {
      const v = valores[c.campo];
      const vacio = v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);
      if (vacio) {
        errores.push(`Falta: ${c.etiqueta}`);
        continue;
      }
      if (c.tipo === 'numero') {
        const n = Number(v);
        if (!Number.isInteger(n) || n < (c.min ?? 0) || n > (c.max ?? 100000)) errores.push(`${c.etiqueta}: debe ser un entero entre ${c.min} y ${c.max}`);
        else datos[c.campo] = n;
      } else if (c.tipo === 'opcion' || c.tipo === 'zocalo') {
        const permitidas = c.tipo === 'zocalo' ? zocalos : c.opciones!;
        if (!permitidas.includes(String(v))) errores.push(`${c.etiqueta}: "${String(v)}" no es una opción válida`);
        else datos[c.campo] = String(v);
      } else {
        const lista = Array.isArray(v) ? v.map(String) : String(v).split(',');
        const permitidas = c.tipo === 'zocalos' ? zocalos : c.opciones!;
        const malas = lista.filter((x) => !permitidas.includes(x));
        if (malas.length) errores.push(`${c.etiqueta}: opciones no válidas (${malas.join(', ')})`);
        else datos[c.campo] = [...new Set(lista)].join(',');
      }
    }
    if (errores.length) throw new BadRequestException(errores);
    return datos;
  }

  private async categoriaEditable(id: number) {
    const categoria = await this.categorias.findOneBy({ id });
    if (!categoria) throw new NotFoundException('Esa categoría no existe');
    if (CATEGORIAS_CON_SECCION_PROPIA.includes(categoria.codigo)) {
      throw new BadRequestException('Los procesadores se gestionan en su propia sección');
    }
    return categoria;
  }

  private async noDuplicado(categoriaId: number, marca: string, nombre: string, excepto?: number) {
    const otro = await this.repo.findOne({ where: { categoria: { id: categoriaId }, marca, nombre } });
    if (otro && otro.id !== excepto) throw new ConflictException('Ya existe un componente con esa marca y modelo en la categoría');
  }

  async crear(dto: ComponenteAdminDto) {
    const categoria = await this.categoriaEditable(dto.categoriaId);
    await this.noDuplicado(categoria.id, dto.marca, dto.nombre);
    const tecnicos = await this.tecnicos(categoria.codigo, dto.tecnicos);
    const nuevo = this.repo.create({
      nombre: dto.nombre, marca: dto.marca, precio: dto.precio, consumoW: dto.consumoW,
      puntajeRendimiento: dto.puntajeRendimiento, busqueda: dto.busqueda || `${dto.marca} ${dto.nombre}`, categoria, ...tecnicos,
    } as Partial<Componente>);
    return this.repo.save(nuevo);
  }

  async actualizar(id: number, dto: ComponenteAdminDto) {
    const actual = await this.obtener(id);
    if (CATEGORIAS_CON_SECCION_PROPIA.includes(actual.categoria.codigo)) {
      throw new BadRequestException('Los procesadores se gestionan en su propia sección');
    }
    const categoria = await this.categoriaEditable(dto.categoriaId);
    await this.noDuplicado(categoria.id, dto.marca, dto.nombre, id);
    const tecnicos = await this.tecnicos(categoria.codigo, dto.tecnicos);
    await this.repo.update(id, {
      nombre: dto.nombre, marca: dto.marca, precio: dto.precio, consumoW: dto.consumoW,
      puntajeRendimiento: dto.puntajeRendimiento, busqueda: dto.busqueda || `${dto.marca} ${dto.nombre}`, categoria, ...tecnicos,
    } as Partial<Componente>);
    return this.obtener(id);
  }

  // No se borra un componente que la gente ya usa en armados guardados
  async eliminar(id: number) {
    const c = await this.obtener(id);
    if (CATEGORIAS_CON_SECCION_PROPIA.includes(c.categoria.codigo)) {
      throw new BadRequestException('Los procesadores se gestionan en su propia sección');
    }
    const [{ total }] = await this.repo.manager.query('SELECT COUNT(*) AS total FROM armado_componentes WHERE componenteId = ?', [id]);
    if (Number(total) > 0) throw new BadRequestException(`No se puede eliminar: está en ${total} armado(s) guardado(s)`);
    await this.repo.delete(id);
  }
}
