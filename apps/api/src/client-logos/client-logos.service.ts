import type { ClientLogo as ClientLogoContract, PaginatedResponse } from '@devsure/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientLogo } from './entities/client-logo.entity';
import { CreateClientLogoDto, UpdateClientLogoDto } from './dto/client-logo.dto';
import { ListClientLogosQueryDto } from './dto/list-client-logos-query.dto';

@Injectable()
export class ClientLogosService {
  constructor(@InjectRepository(ClientLogo) private readonly repository: Repository<ClientLogo>) {}

  async list(ownerId: string, query: ListClientLogosQueryDto): Promise<PaginatedResponse<ClientLogoContract>> {
    const builder = this.repository
      .createQueryBuilder('clientLogo')
      .where('clientLogo.ownerId = :ownerId', { ownerId });
    if (query.search !== undefined) {
      builder.andWhere('LOWER(clientLogo.name) LIKE :search', { search: `%${query.search.toLowerCase()}%` });
    }
    const [items, total] = await builder
      .orderBy('clientLogo.sortOrder', 'ASC')
      .addOrderBy('clientLogo.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return {
      items: items.map(toClientLogo),
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  /** Used by the public portfolio aggregate — every logo for the owner, unpaginated. */
  async listAll(ownerId: string): Promise<ClientLogoContract[]> {
    const items = await this.repository.find({
      where: { ownerId },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
    return items.map(toClientLogo);
  }

  async get(ownerId: string, id: string): Promise<ClientLogoContract> {
    return toClientLogo(await this.entity(ownerId, id));
  }

  async create(ownerId: string, input: CreateClientLogoDto): Promise<ClientLogoContract> {
    const entity = this.repository.create({
      ownerId,
      name: input.name,
      logo: input.logo,
      websiteUrl: input.websiteUrl || null,
      sortOrder: input.sortOrder ?? 0,
    });
    return toClientLogo(await this.repository.save(entity));
  }

  async update(ownerId: string, id: string, input: UpdateClientLogoDto): Promise<ClientLogoContract> {
    const entity = await this.entity(ownerId, id);
    if (input.name !== undefined) entity.name = input.name;
    if (input.logo !== undefined) entity.logo = input.logo;
    if (input.websiteUrl !== undefined) entity.websiteUrl = input.websiteUrl || null;
    if (input.sortOrder !== undefined) entity.sortOrder = input.sortOrder;
    return toClientLogo(await this.repository.save(entity));
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const result = await this.repository.delete({ id, ownerId });
    if (!result.affected) throw new NotFoundException();
  }

  private async entity(ownerId: string, id: string): Promise<ClientLogo> {
    const entity = await this.repository.findOneBy({ id, ownerId });
    if (!entity) throw new NotFoundException();
    return entity;
  }
}

function toClientLogo(entity: ClientLogo): ClientLogoContract {
  return {
    id: entity.id,
    name: entity.name,
    logo: entity.logo,
    ...(entity.websiteUrl ? { websiteUrl: entity.websiteUrl } : {}),
    sortOrder: entity.sortOrder,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
