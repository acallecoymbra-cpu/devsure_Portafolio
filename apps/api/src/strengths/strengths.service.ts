import type { PaginatedResponse, Strength as StrengthContract } from '@devsure/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Strength } from './entities/strength.entity';
import { CreateStrengthDto, UpdateStrengthDto } from './dto/strength.dto';
import { ListStrengthsQueryDto } from './dto/list-strengths-query.dto';

@Injectable()
export class StrengthsService {
  constructor(@InjectRepository(Strength) private readonly repository: Repository<Strength>) {}

  async list(ownerId: string, query: ListStrengthsQueryDto): Promise<PaginatedResponse<StrengthContract>> {
    const [items, total] = await this.repository.findAndCount({
      where: { ownerId },
      order: { sortOrder: 'ASC', id: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return {
      items: items.map(toStrength),
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async get(ownerId: string, id: string): Promise<StrengthContract> {
    return toStrength(await this.entity(ownerId, id));
  }

  async create(ownerId: string, input: CreateStrengthDto): Promise<StrengthContract> {
    const entity = this.repository.create({
      ownerId,
      label: input.label,
      title: input.title,
      body: input.body,
      techStack: input.techStack ?? null,
      sortOrder: input.sortOrder ?? 0,
    });
    return toStrength(await this.repository.save(entity));
  }

  async update(ownerId: string, id: string, input: UpdateStrengthDto): Promise<StrengthContract> {
    const entity = await this.entity(ownerId, id);
    if (input.label !== undefined) entity.label = input.label;
    if (input.title !== undefined) entity.title = input.title;
    if (input.body !== undefined) entity.body = input.body;
    if (input.techStack !== undefined) entity.techStack = input.techStack ?? null;
    if (input.sortOrder !== undefined) entity.sortOrder = input.sortOrder;
    return toStrength(await this.repository.save(entity));
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const result = await this.repository.delete({ id, ownerId });
    if (!result.affected) throw new NotFoundException();
  }

  private async entity(ownerId: string, id: string): Promise<Strength> {
    const entity = await this.repository.findOneBy({ id, ownerId });
    if (!entity) throw new NotFoundException();
    return entity;
  }
}

function toStrength(entity: Strength): StrengthContract {
  return {
    id: entity.id,
    label: entity.label,
    title: entity.title,
    body: entity.body,
    techStack: entity.techStack ?? [],
    sortOrder: entity.sortOrder,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
