import type { PaginatedResponse, WorkStyleItem as WorkStyleItemContract } from '@devsure/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkStyleItem } from './entities/work-style-item.entity';
import { CreateWorkStyleItemDto, UpdateWorkStyleItemDto } from './dto/work-style-item.dto';
import { ListWorkStyleItemsQueryDto } from './dto/list-work-style-items-query.dto';

@Injectable()
export class WorkStyleItemsService {
  constructor(@InjectRepository(WorkStyleItem) private readonly repository: Repository<WorkStyleItem>) {}

  async list(ownerId: string, query: ListWorkStyleItemsQueryDto): Promise<PaginatedResponse<WorkStyleItemContract>> {
    const [items, total] = await this.repository.findAndCount({
      where: { ownerId },
      order: { sortOrder: 'ASC', id: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return {
      items: items.map(toWorkStyleItem),
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async get(ownerId: string, id: string): Promise<WorkStyleItemContract> {
    return toWorkStyleItem(await this.entity(ownerId, id));
  }

  async create(ownerId: string, input: CreateWorkStyleItemDto): Promise<WorkStyleItemContract> {
    const entity = this.repository.create({
      ownerId,
      text: input.text,
      sortOrder: input.sortOrder ?? 0,
    });
    return toWorkStyleItem(await this.repository.save(entity));
  }

  async update(ownerId: string, id: string, input: UpdateWorkStyleItemDto): Promise<WorkStyleItemContract> {
    const entity = await this.entity(ownerId, id);
    if (input.text !== undefined) entity.text = input.text;
    if (input.sortOrder !== undefined) entity.sortOrder = input.sortOrder;
    return toWorkStyleItem(await this.repository.save(entity));
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const result = await this.repository.delete({ id, ownerId });
    if (!result.affected) throw new NotFoundException();
  }

  private async entity(ownerId: string, id: string): Promise<WorkStyleItem> {
    const entity = await this.repository.findOneBy({ id, ownerId });
    if (!entity) throw new NotFoundException();
    return entity;
  }
}

function toWorkStyleItem(entity: WorkStyleItem): WorkStyleItemContract {
  return {
    id: entity.id,
    text: entity.text,
    sortOrder: entity.sortOrder,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
