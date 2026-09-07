import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { AdminTechnology, PaginatedResponse } from '@devsure/contracts';
import { Technology } from './entities/technology.entity';
import { CreateTechnologyDto, UpdateTechnologyDto } from './dto/admin-technology.dto';
import { ListTechnologiesQueryDto } from './dto/list-technologies-query.dto';

@Injectable()
export class AdminTechnologiesService {
  constructor(@InjectRepository(Technology) private readonly repository: Repository<Technology>) {}
  async list(query: ListTechnologiesQueryDto): Promise<PaginatedResponse<AdminTechnology>> {
    const builder = this.repository.createQueryBuilder('technology');
    if (query.search !== undefined) builder.andWhere('LOWER(technology.name) LIKE :search', { search: `%${query.search.toLowerCase()}%` });
    if (query.category !== undefined) builder.andWhere('technology.category = :category', { category: query.category });
    if (query.featured !== undefined) builder.andWhere('technology.featured = :featured', { featured: query.featured });
    const [items, total] = await builder.orderBy('technology.sortOrder', 'ASC').addOrderBy('technology.name', 'ASC').addOrderBy('technology.id', 'ASC')
      .skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
    return { items: items.map(toAdminTechnology), meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }
  async get(id: string): Promise<AdminTechnology> { return toAdminTechnology(await this.entity(id)); }
  async create(input: CreateTechnologyDto): Promise<AdminTechnology> {
    return this.save(this.repository.create({ ...input, summary: input.summary || null, publishedAt: input.publicationStatus === 'published' ? new Date() : undefined }));
  }
  async update(id: string, input: UpdateTechnologyDto): Promise<AdminTechnology> {
    const entity = await this.entity(id);
    this.repository.merge(entity, input);
    if (input.summary !== undefined) entity.summary = input.summary || null;
    if (entity.publicationStatus === 'published' && !entity.publishedAt) entity.publishedAt = new Date();
    return this.save(entity);
  }
  async remove(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (!result.affected) throw new NotFoundException();
  }
  private async entity(id: string): Promise<Technology> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) throw new NotFoundException();
    return entity;
  }
  private async save(entity: Technology): Promise<AdminTechnology> {
    const duplicate = await this.repository.findOneBy({ slug: entity.slug });
    if (duplicate && duplicate.id !== entity.id) throw new ConflictException();
    try { return toAdminTechnology(await this.repository.save(entity)); }
    catch (error) {
      // Driver-neutral fallback also handles concurrent inserts of the same slug.
      if (error instanceof QueryFailedError && /unique/i.test(error.message)) throw new ConflictException();
      throw error;
    }
  }
}
export function toAdminTechnology(entity: Technology): AdminTechnology {
  return { id: entity.id, name: entity.name, slug: entity.slug, category: entity.category,
    ...(entity.summary === null ? {} : { summary: entity.summary }), iconKey: entity.iconKey,
    featured: entity.featured, sortOrder: entity.sortOrder, publicationStatus: entity.publicationStatus,
    publishedAt: entity.publishedAt?.toISOString() ?? null, createdAt: entity.createdAt.toISOString(), updatedAt: entity.updatedAt.toISOString() };
}
