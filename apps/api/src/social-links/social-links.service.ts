import type { SocialLink as SocialLinkContract, PaginatedResponse } from '@devsure/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialLink } from './entities/social-link.entity';
import { CreateSocialLinkDto, UpdateSocialLinkDto } from './dto/social-link.dto';
import { ListSocialLinksQueryDto } from './dto/list-social-links-query.dto';

@Injectable()
export class SocialLinksService {
  constructor(@InjectRepository(SocialLink) private readonly repository: Repository<SocialLink>) {}

  async list(ownerId: string, query: ListSocialLinksQueryDto): Promise<PaginatedResponse<SocialLinkContract>> {
    const builder = this.repository
      .createQueryBuilder('socialLink')
      .where('socialLink.ownerId = :ownerId', { ownerId });
    if (query.search !== undefined) {
      builder.andWhere('LOWER(socialLink.name) LIKE :search', { search: `%${query.search.toLowerCase()}%` });
    }
    const [items, total] = await builder
      .orderBy('socialLink.sortOrder', 'ASC')
      .addOrderBy('socialLink.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return {
      items: items.map(toSocialLink),
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  /** Used by the public portfolio aggregate — every link for the owner, unpaginated. */
  async listAll(ownerId: string): Promise<SocialLinkContract[]> {
    const items = await this.repository.find({
      where: { ownerId },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
    return items.map(toSocialLink);
  }

  async get(ownerId: string, id: string): Promise<SocialLinkContract> {
    return toSocialLink(await this.entity(ownerId, id));
  }

  async create(ownerId: string, input: CreateSocialLinkDto): Promise<SocialLinkContract> {
    const entity = this.repository.create({
      ownerId,
      name: input.name,
      url: input.url,
      iconKey: input.iconKey,
      icon: input.icon || null,
      sortOrder: input.sortOrder ?? 0,
    });
    return toSocialLink(await this.repository.save(entity));
  }

  async update(ownerId: string, id: string, input: UpdateSocialLinkDto): Promise<SocialLinkContract> {
    const entity = await this.entity(ownerId, id);
    if (input.name !== undefined) entity.name = input.name;
    if (input.url !== undefined) entity.url = input.url;
    if (input.iconKey !== undefined) entity.iconKey = input.iconKey;
    if (input.icon !== undefined) entity.icon = input.icon || null;
    if (input.sortOrder !== undefined) entity.sortOrder = input.sortOrder;
    return toSocialLink(await this.repository.save(entity));
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const result = await this.repository.delete({ id, ownerId });
    if (!result.affected) throw new NotFoundException();
  }

  private async entity(ownerId: string, id: string): Promise<SocialLink> {
    const entity = await this.repository.findOneBy({ id, ownerId });
    if (!entity) throw new NotFoundException();
    return entity;
  }
}

function toSocialLink(entity: SocialLink): SocialLinkContract {
  return {
    id: entity.id,
    name: entity.name,
    url: entity.url,
    iconKey: entity.iconKey,
    ...(entity.icon ? { icon: entity.icon } : {}),
    sortOrder: entity.sortOrder,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
