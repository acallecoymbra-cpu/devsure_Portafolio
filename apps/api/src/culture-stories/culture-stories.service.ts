import type { CultureStory as CultureStoryContract, PaginatedResponse } from '@devsure/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CultureStory } from './entities/culture-story.entity';
import { CreateCultureStoryDto, UpdateCultureStoryDto } from './dto/culture-story.dto';
import { ListCultureStoriesQueryDto } from './dto/list-culture-stories-query.dto';

@Injectable()
export class CultureStoriesService {
  constructor(@InjectRepository(CultureStory) private readonly repository: Repository<CultureStory>) {}

  async list(ownerId: string, query: ListCultureStoriesQueryDto): Promise<PaginatedResponse<CultureStoryContract>> {
    const [items, total] = await this.repository.findAndCount({
      where: { ownerId },
      order: { sortOrder: 'ASC', id: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return {
      items: items.map(toCultureStory),
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async get(ownerId: string, id: string): Promise<CultureStoryContract> {
    return toCultureStory(await this.entity(ownerId, id));
  }

  async create(ownerId: string, input: CreateCultureStoryDto): Promise<CultureStoryContract> {
    const entity = this.repository.create({
      ownerId,
      kicker: input.kicker,
      title: input.title,
      description: input.description,
      imageSrc: input.imageSrc,
      imageAlt: input.imageAlt,
      sortOrder: input.sortOrder ?? 0,
    });
    return toCultureStory(await this.repository.save(entity));
  }

  async update(ownerId: string, id: string, input: UpdateCultureStoryDto): Promise<CultureStoryContract> {
    const entity = await this.entity(ownerId, id);
    if (input.kicker !== undefined) entity.kicker = input.kicker;
    if (input.title !== undefined) entity.title = input.title;
    if (input.description !== undefined) entity.description = input.description;
    if (input.imageSrc !== undefined) entity.imageSrc = input.imageSrc;
    if (input.imageAlt !== undefined) entity.imageAlt = input.imageAlt;
    if (input.sortOrder !== undefined) entity.sortOrder = input.sortOrder;
    return toCultureStory(await this.repository.save(entity));
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const result = await this.repository.delete({ id, ownerId });
    if (!result.affected) throw new NotFoundException();
  }

  private async entity(ownerId: string, id: string): Promise<CultureStory> {
    const entity = await this.repository.findOneBy({ id, ownerId });
    if (!entity) throw new NotFoundException();
    return entity;
  }
}

function toCultureStory(entity: CultureStory): CultureStoryContract {
  return {
    id: entity.id,
    kicker: entity.kicker,
    title: entity.title,
    description: entity.description,
    imageSrc: entity.imageSrc,
    imageAlt: entity.imageAlt,
    sortOrder: entity.sortOrder,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
