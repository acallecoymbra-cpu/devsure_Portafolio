import type { CulturePillar as CulturePillarContract, PaginatedResponse } from '@devsure/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CulturePillar } from './entities/culture-pillar.entity';
import { CreateCulturePillarDto, UpdateCulturePillarDto } from './dto/culture-pillar.dto';
import { ListCulturePillarsQueryDto } from './dto/list-culture-pillars-query.dto';

@Injectable()
export class CulturePillarsService {
  constructor(@InjectRepository(CulturePillar) private readonly repository: Repository<CulturePillar>) {}

  async list(ownerId: string, query: ListCulturePillarsQueryDto): Promise<PaginatedResponse<CulturePillarContract>> {
    const [items, total] = await this.repository.findAndCount({
      where: { ownerId },
      order: { sortOrder: 'ASC', id: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return {
      items: items.map(toCulturePillar),
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async get(ownerId: string, id: string): Promise<CulturePillarContract> {
    return toCulturePillar(await this.entity(ownerId, id));
  }

  async create(ownerId: string, input: CreateCulturePillarDto): Promise<CulturePillarContract> {
    const entity = this.repository.create({
      ownerId,
      title: input.title,
      keywords: input.keywords ?? '',
      description: input.description,
      visual: input.visual,
      sortOrder: input.sortOrder ?? 0,
    });
    return toCulturePillar(await this.repository.save(entity));
  }

  async update(ownerId: string, id: string, input: UpdateCulturePillarDto): Promise<CulturePillarContract> {
    const entity = await this.entity(ownerId, id);
    if (input.title !== undefined) entity.title = input.title;
    if (input.keywords !== undefined) entity.keywords = input.keywords;
    if (input.description !== undefined) entity.description = input.description;
    if (input.visual !== undefined) entity.visual = input.visual;
    if (input.sortOrder !== undefined) entity.sortOrder = input.sortOrder;
    return toCulturePillar(await this.repository.save(entity));
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const result = await this.repository.delete({ id, ownerId });
    if (!result.affected) throw new NotFoundException();
  }

  private async entity(ownerId: string, id: string): Promise<CulturePillar> {
    const entity = await this.repository.findOneBy({ id, ownerId });
    if (!entity) throw new NotFoundException();
    return entity;
  }
}

function toCulturePillar(entity: CulturePillar): CulturePillarContract {
  return {
    id: entity.id,
    title: entity.title,
    keywords: entity.keywords,
    description: entity.description,
    visual: entity.visual,
    sortOrder: entity.sortOrder,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
