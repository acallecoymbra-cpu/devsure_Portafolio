import type { PaginatedResponse, Study as StudyContract } from '@devsure/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Study } from './entities/study.entity';
import { CreateStudyDto, UpdateStudyDto } from './dto/study.dto';
import { ListStudiesQueryDto } from './dto/list-studies-query.dto';

@Injectable()
export class StudiesService {
  constructor(@InjectRepository(Study) private readonly repository: Repository<Study>) {}

  async list(ownerId: string, query: ListStudiesQueryDto): Promise<PaginatedResponse<StudyContract>> {
    const builder = this.repository.createQueryBuilder('study').where('study.ownerId = :ownerId', { ownerId });
    if (query.search !== undefined) {
      builder.andWhere('LOWER(study.institution) LIKE :search', { search: `%${query.search.toLowerCase()}%` });
    }
    const [items, total] = await builder
      .orderBy('study.sortOrder', 'ASC')
      .addOrderBy('study.startDate', 'DESC')
      .addOrderBy('study.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return {
      items: items.map(toStudy),
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async get(ownerId: string, id: string): Promise<StudyContract> {
    return toStudy(await this.entity(ownerId, id));
  }

  async create(ownerId: string, input: CreateStudyDto): Promise<StudyContract> {
    const entity = this.repository.create({
      ownerId,
      institution: input.institution,
      title: input.title,
      field: input.field || null,
      description: input.description ?? null,
      startDate: input.startDate ?? null,
      endDate: input.inProgress ? null : (input.endDate ?? null),
      inProgress: input.inProgress ?? false,
      logo: input.logo || null,
      sortOrder: input.sortOrder ?? 0,
    });
    return toStudy(await this.repository.save(entity));
  }

  async update(ownerId: string, id: string, input: UpdateStudyDto): Promise<StudyContract> {
    const entity = await this.entity(ownerId, id);
    if (input.institution !== undefined) entity.institution = input.institution;
    if (input.title !== undefined) entity.title = input.title;
    if (input.field !== undefined) entity.field = input.field || null;
    if (input.description !== undefined) entity.description = input.description ?? null;
    if (input.startDate !== undefined) entity.startDate = input.startDate ?? null;
    if (input.inProgress !== undefined) entity.inProgress = input.inProgress;
    if (input.endDate !== undefined) entity.endDate = entity.inProgress ? null : (input.endDate ?? null);
    else if (input.inProgress) entity.endDate = null;
    if (input.logo !== undefined) entity.logo = input.logo || null;
    if (input.sortOrder !== undefined) entity.sortOrder = input.sortOrder;
    return toStudy(await this.repository.save(entity));
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const result = await this.repository.delete({ id, ownerId });
    if (!result.affected) throw new NotFoundException();
  }

  private async entity(ownerId: string, id: string): Promise<Study> {
    const entity = await this.repository.findOneBy({ id, ownerId });
    if (!entity) throw new NotFoundException();
    return entity;
  }
}

function toStudy(entity: Study): StudyContract {
  return {
    id: entity.id,
    institution: entity.institution,
    title: entity.title,
    ...(entity.field ? { field: entity.field } : {}),
    description: entity.description ?? {},
    ...(entity.startDate ? { startDate: entity.startDate } : {}),
    endDate: entity.endDate,
    inProgress: entity.inProgress,
    ...(entity.logo ? { logo: entity.logo } : {}),
    sortOrder: entity.sortOrder,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
