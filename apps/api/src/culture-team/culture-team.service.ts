import type { CultureTeamMember as CultureTeamMemberContract, PaginatedResponse } from '@devsure/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CultureTeamMember } from './entities/culture-team-member.entity';
import { CreateCultureTeamMemberDto, UpdateCultureTeamMemberDto } from './dto/culture-team-member.dto';
import { ListCultureTeamQueryDto } from './dto/list-culture-team-query.dto';

@Injectable()
export class CultureTeamService {
  constructor(@InjectRepository(CultureTeamMember) private readonly repository: Repository<CultureTeamMember>) {}

  async list(ownerId: string, query: ListCultureTeamQueryDto): Promise<PaginatedResponse<CultureTeamMemberContract>> {
    const [items, total] = await this.repository.findAndCount({
      where: { ownerId },
      order: { sortOrder: 'ASC', id: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return {
      items: items.map(toCultureTeamMember),
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async get(ownerId: string, id: string): Promise<CultureTeamMemberContract> {
    return toCultureTeamMember(await this.entity(ownerId, id));
  }

  async create(ownerId: string, input: CreateCultureTeamMemberDto): Promise<CultureTeamMemberContract> {
    const entity = this.repository.create({
      ownerId,
      name: input.name,
      role: input.role,
      neutralImage: input.neutralImage,
      smilingImage: input.smilingImage,
      alt: input.alt ?? null,
      sortOrder: input.sortOrder ?? 0,
    });
    return toCultureTeamMember(await this.repository.save(entity));
  }

  async update(ownerId: string, id: string, input: UpdateCultureTeamMemberDto): Promise<CultureTeamMemberContract> {
    const entity = await this.entity(ownerId, id);
    if (input.name !== undefined) entity.name = input.name;
    if (input.role !== undefined) entity.role = input.role;
    if (input.neutralImage !== undefined) entity.neutralImage = input.neutralImage;
    if (input.smilingImage !== undefined) entity.smilingImage = input.smilingImage;
    if (input.alt !== undefined) entity.alt = input.alt || null;
    if (input.sortOrder !== undefined) entity.sortOrder = input.sortOrder;
    return toCultureTeamMember(await this.repository.save(entity));
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const result = await this.repository.delete({ id, ownerId });
    if (!result.affected) throw new NotFoundException();
  }

  private async entity(ownerId: string, id: string): Promise<CultureTeamMember> {
    const entity = await this.repository.findOneBy({ id, ownerId });
    if (!entity) throw new NotFoundException();
    return entity;
  }
}

function toCultureTeamMember(entity: CultureTeamMember): CultureTeamMemberContract {
  return {
    id: entity.id,
    name: entity.name,
    role: entity.role,
    neutralImage: entity.neutralImage,
    smilingImage: entity.smilingImage,
    alt: entity.alt ?? undefined,
    sortOrder: entity.sortOrder,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
