import type { Experience as ExperienceContract, PaginatedResponse } from '@devsure/contracts';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { slugify } from '../common/slugify';
import { Experience } from './entities/experience.entity';
import { CreateExperienceDto, UpdateExperienceDto } from './dto/experience.dto';
import { ListExperiencesQueryDto } from './dto/list-experiences-query.dto';

@Injectable()
export class ExperiencesService {
  constructor(@InjectRepository(Experience) private readonly repository: Repository<Experience>) {}

  async list(ownerId: string, query: ListExperiencesQueryDto): Promise<PaginatedResponse<ExperienceContract>> {
    const builder = this.repository.createQueryBuilder('experience').where('experience.ownerId = :ownerId', { ownerId });
    if (query.search !== undefined) {
      builder.andWhere('LOWER(experience.company) LIKE :search', { search: `%${query.search.toLowerCase()}%` });
    }
    const [items, total] = await builder
      .orderBy('experience.sortOrder', 'ASC')
      .addOrderBy('experience.company', 'ASC')
      .addOrderBy('experience.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return {
      items: items.map(toExperience),
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async get(ownerId: string, id: string): Promise<ExperienceContract> {
    return toExperience(await this.entity(ownerId, id));
  }

  async create(ownerId: string, input: CreateExperienceDto): Promise<ExperienceContract> {
    return this.save(
      this.repository.create({
        ownerId,
        company: input.company,
        slug: input.slug?.trim() || slugify(input.company),
        logo: input.logo || null,
        summary: input.summary ?? null,
        techStack: input.techStack ?? null,
        levels: input.levels,
        sortOrder: input.sortOrder ?? 0,
      }),
    );
  }

  async update(ownerId: string, id: string, input: UpdateExperienceDto): Promise<ExperienceContract> {
    const entity = await this.entity(ownerId, id);
    if (input.company !== undefined) entity.company = input.company;
    if (input.slug !== undefined) entity.slug = input.slug;
    if (input.logo !== undefined) entity.logo = input.logo || null;
    if (input.summary !== undefined) entity.summary = input.summary ?? null;
    if (input.techStack !== undefined) entity.techStack = input.techStack ?? null;
    if (input.levels !== undefined) entity.levels = input.levels;
    if (input.sortOrder !== undefined) entity.sortOrder = input.sortOrder;
    return this.save(entity);
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const result = await this.repository.delete({ id, ownerId });
    if (!result.affected) throw new NotFoundException();
  }

  private async entity(ownerId: string, id: string): Promise<Experience> {
    const entity = await this.repository.findOneBy({ id, ownerId });
    if (!entity) throw new NotFoundException();
    return entity;
  }

  private async save(entity: Experience): Promise<ExperienceContract> {
    const duplicate = await this.repository.findOneBy({ slug: entity.slug });
    if (duplicate && duplicate.id !== entity.id) throw new ConflictException();
    try {
      return toExperience(await this.repository.save(entity));
    } catch (error) {
      // Driver-neutral fallback also handles concurrent inserts of the same slug.
      if (error instanceof QueryFailedError && /unique/i.test(error.message)) throw new ConflictException();
      throw error;
    }
  }
}

function toExperience(entity: Experience): ExperienceContract {
  return {
    id: entity.id,
    company: entity.company,
    slug: entity.slug,
    ...(entity.logo ? { logo: entity.logo } : {}),
    summary: entity.summary ?? {},
    techStack: entity.techStack ?? [],
    levels: entity.levels,
    sortOrder: entity.sortOrder,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
