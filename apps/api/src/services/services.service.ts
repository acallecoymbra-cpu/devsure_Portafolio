import type { PaginatedResponse, Service as ServiceContract } from '@devsure/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { ListServicesQueryDto } from './dto/list-services-query.dto';

@Injectable()
export class ServicesService {
  constructor(@InjectRepository(Service) private readonly repository: Repository<Service>) {}

  async list(ownerId: string, query: ListServicesQueryDto): Promise<PaginatedResponse<ServiceContract>> {
    const [items, total] = await this.repository.findAndCount({
      where: { ownerId },
      order: { sortOrder: 'ASC', id: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return {
      items: items.map(toService),
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async get(ownerId: string, id: string): Promise<ServiceContract> {
    return toService(await this.entity(ownerId, id));
  }

  async create(ownerId: string, input: CreateServiceDto): Promise<ServiceContract> {
    const entity = this.repository.create({
      ownerId,
      title: input.title,
      description: input.description,
      icon: input.icon || null,
      sortOrder: input.sortOrder ?? 0,
    });
    return toService(await this.repository.save(entity));
  }

  async update(ownerId: string, id: string, input: UpdateServiceDto): Promise<ServiceContract> {
    const entity = await this.entity(ownerId, id);
    if (input.title !== undefined) entity.title = input.title;
    if (input.description !== undefined) entity.description = input.description;
    if (input.icon !== undefined) entity.icon = input.icon || null;
    if (input.sortOrder !== undefined) entity.sortOrder = input.sortOrder;
    return toService(await this.repository.save(entity));
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const result = await this.repository.delete({ id, ownerId });
    if (!result.affected) throw new NotFoundException();
  }

  private async entity(ownerId: string, id: string): Promise<Service> {
    const entity = await this.repository.findOneBy({ id, ownerId });
    if (!entity) throw new NotFoundException();
    return entity;
  }
}

function toService(entity: Service): ServiceContract {
  return {
    id: entity.id,
    title: entity.title,
    description: entity.description,
    ...(entity.icon ? { icon: entity.icon } : {}),
    sortOrder: entity.sortOrder,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
