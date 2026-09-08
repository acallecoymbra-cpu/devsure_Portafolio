import type { Faq as FaqContract, PaginatedResponse } from '@devsure/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faq } from './entities/faq.entity';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';
import { ListFaqsQueryDto } from './dto/list-faqs-query.dto';

@Injectable()
export class FaqsService {
  constructor(@InjectRepository(Faq) private readonly repository: Repository<Faq>) {}

  async list(ownerId: string, query: ListFaqsQueryDto): Promise<PaginatedResponse<FaqContract>> {
    const [items, total] = await this.repository.findAndCount({
      where: { ownerId },
      order: { sortOrder: 'ASC', id: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return {
      items: items.map(toFaq),
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async get(ownerId: string, id: string): Promise<FaqContract> {
    return toFaq(await this.entity(ownerId, id));
  }

  async create(ownerId: string, input: CreateFaqDto): Promise<FaqContract> {
    const entity = this.repository.create({
      ownerId,
      question: input.question,
      answer: input.answer,
      sortOrder: input.sortOrder ?? 0,
    });
    return toFaq(await this.repository.save(entity));
  }

  async update(ownerId: string, id: string, input: UpdateFaqDto): Promise<FaqContract> {
    const entity = await this.entity(ownerId, id);
    if (input.question !== undefined) entity.question = input.question;
    if (input.answer !== undefined) entity.answer = input.answer;
    if (input.sortOrder !== undefined) entity.sortOrder = input.sortOrder;
    return toFaq(await this.repository.save(entity));
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const result = await this.repository.delete({ id, ownerId });
    if (!result.affected) throw new NotFoundException();
  }

  private async entity(ownerId: string, id: string): Promise<Faq> {
    const entity = await this.repository.findOneBy({ id, ownerId });
    if (!entity) throw new NotFoundException();
    return entity;
  }
}

function toFaq(entity: Faq): FaqContract {
  return {
    id: entity.id,
    question: entity.question,
    answer: entity.answer,
    sortOrder: entity.sortOrder,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
