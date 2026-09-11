import type { PaginatedResponse, Testimonial as TestimonialContract } from '@devsure/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Testimonial } from './entities/testimonial.entity';
import { CreateTestimonialDto, UpdateTestimonialDto } from './dto/testimonial.dto';
import { ListTestimonialsQueryDto } from './dto/list-testimonials-query.dto';

@Injectable()
export class TestimonialsService {
  constructor(@InjectRepository(Testimonial) private readonly repository: Repository<Testimonial>) {}

  async list(ownerId: string, query: ListTestimonialsQueryDto): Promise<PaginatedResponse<TestimonialContract>> {
    const builder = this.repository
      .createQueryBuilder('testimonial')
      .where('testimonial.ownerId = :ownerId', { ownerId });
    if (query.search !== undefined) {
      builder.andWhere('LOWER(testimonial.author) LIKE :search', { search: `%${query.search.toLowerCase()}%` });
    }
    const [items, total] = await builder
      .orderBy('testimonial.sortOrder', 'ASC')
      .addOrderBy('testimonial.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return {
      items: items.map(toTestimonial),
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async get(ownerId: string, id: string): Promise<TestimonialContract> {
    return toTestimonial(await this.entity(ownerId, id));
  }

  async create(ownerId: string, input: CreateTestimonialDto): Promise<TestimonialContract> {
    const entity = this.repository.create({
      ownerId,
      author: input.author,
      role: input.role || null,
      company: input.company || null,
      quote: input.quote,
      avatar: input.avatar || null,
      rating: input.rating ?? 5,
      highlightText: input.highlightText || null,
      highlightIcon: input.highlightIcon ?? null,
      source: input.source ?? null,
      sourceUrl: input.sourceUrl || null,
      sortOrder: input.sortOrder ?? 0,
    });
    return toTestimonial(await this.repository.save(entity));
  }

  async update(ownerId: string, id: string, input: UpdateTestimonialDto): Promise<TestimonialContract> {
    const entity = await this.entity(ownerId, id);
    if (input.author !== undefined) entity.author = input.author;
    if (input.role !== undefined) entity.role = input.role || null;
    if (input.company !== undefined) entity.company = input.company || null;
    if (input.quote !== undefined) entity.quote = input.quote;
    if (input.avatar !== undefined) entity.avatar = input.avatar || null;
    if (input.rating !== undefined) entity.rating = input.rating;
    if (input.highlightText !== undefined) entity.highlightText = input.highlightText || null;
    if (input.highlightIcon !== undefined) entity.highlightIcon = input.highlightIcon ?? null;
    if (input.source !== undefined) entity.source = input.source ?? null;
    if (input.sourceUrl !== undefined) entity.sourceUrl = input.sourceUrl || null;
    if (input.sortOrder !== undefined) entity.sortOrder = input.sortOrder;
    return toTestimonial(await this.repository.save(entity));
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const result = await this.repository.delete({ id, ownerId });
    if (!result.affected) throw new NotFoundException();
  }

  private async entity(ownerId: string, id: string): Promise<Testimonial> {
    const entity = await this.repository.findOneBy({ id, ownerId });
    if (!entity) throw new NotFoundException();
    return entity;
  }
}

function toTestimonial(entity: Testimonial): TestimonialContract {
  return {
    id: entity.id,
    author: entity.author,
    ...(entity.role ? { role: entity.role } : {}),
    ...(entity.company ? { company: entity.company } : {}),
    quote: entity.quote,
    ...(entity.avatar ? { avatar: entity.avatar } : {}),
    rating: entity.rating,
    ...(entity.highlightText ? { highlightText: entity.highlightText } : {}),
    ...(entity.highlightIcon ? { highlightIcon: entity.highlightIcon } : {}),
    ...(entity.source ? { source: entity.source } : {}),
    ...(entity.sourceUrl ? { sourceUrl: entity.sourceUrl } : {}),
    sortOrder: entity.sortOrder,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
