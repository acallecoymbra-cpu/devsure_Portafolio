import type { PaginatedResponse, Post as PostContract } from '@devsure/contracts';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { firstTranslatableValue, slugify } from '../common/slugify';
import { Post } from './entities/post.entity';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';

@Injectable()
export class PostsService {
  constructor(@InjectRepository(Post) private readonly repository: Repository<Post>) {}

  async list(ownerId: string, query: ListPostsQueryDto): Promise<PaginatedResponse<PostContract>> {
    const builder = this.repository.createQueryBuilder('post').where('post.ownerId = :ownerId', { ownerId });
    if (query.published === 'draft') builder.andWhere('post.publishedAt IS NULL');
    if (query.published === 'published') builder.andWhere('post.publishedAt IS NOT NULL');
    if (query.category !== undefined) builder.andWhere('post.category = :category', { category: query.category });
    if (query.search !== undefined) {
      builder.andWhere('LOWER(post.slug) LIKE :search', { search: `%${query.search.toLowerCase()}%` });
    }
    const [items, total] = await builder
      .orderBy('post.sortOrder', 'ASC')
      .addOrderBy('post.publishedAt', 'DESC')
      .addOrderBy('post.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return {
      items: items.map(toPost),
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async get(ownerId: string, id: string): Promise<PostContract> {
    return toPost(await this.entity(ownerId, id));
  }

  async create(ownerId: string, input: CreatePostDto): Promise<PostContract> {
    const entity = this.repository.create({
      ownerId,
      title: input.title,
      slug: input.slug?.trim() || slugify(firstTranslatableValue(input.title)),
      excerpt: input.excerpt ?? null,
      content: input.content,
      category: input.category ?? null,
      coverImage: input.coverImage || null,
      sortOrder: input.sortOrder ?? 0,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
    });
    return toPost(await this.save(entity));
  }

  async update(ownerId: string, id: string, input: UpdatePostDto): Promise<PostContract> {
    const entity = await this.entity(ownerId, id);
    if (input.title !== undefined) entity.title = input.title;
    if (input.slug !== undefined) entity.slug = input.slug;
    if (input.excerpt !== undefined) entity.excerpt = input.excerpt ?? null;
    if (input.content !== undefined) entity.content = input.content;
    if (input.category !== undefined) entity.category = input.category ?? null;
    if (input.coverImage !== undefined) entity.coverImage = input.coverImage || null;
    if (input.sortOrder !== undefined) entity.sortOrder = input.sortOrder;
    if (input.publishedAt !== undefined) entity.publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
    return toPost(await this.save(entity));
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const result = await this.repository.delete({ id, ownerId });
    if (!result.affected) throw new NotFoundException();
  }

  private async entity(ownerId: string, id: string): Promise<Post> {
    const entity = await this.repository.findOneBy({ id, ownerId });
    if (!entity) throw new NotFoundException();
    return entity;
  }

  private async save(entity: Post): Promise<Post> {
    const duplicate = await this.repository.findOneBy({ slug: entity.slug });
    if (duplicate && duplicate.id !== entity.id) throw new ConflictException();
    try {
      return await this.repository.save(entity);
    } catch (error) {
      // Driver-neutral fallback also handles concurrent inserts of the same slug.
      if (error instanceof QueryFailedError && /unique/i.test(error.message)) throw new ConflictException();
      throw error;
    }
  }
}

function toPost(entity: Post): PostContract {
  return {
    id: entity.id,
    title: entity.title,
    slug: entity.slug,
    excerpt: entity.excerpt ?? {},
    content: entity.content,
    ...(entity.category ? { category: entity.category } : {}),
    ...(entity.coverImage ? { coverImage: entity.coverImage } : {}),
    sortOrder: entity.sortOrder,
    publishedAt: entity.publishedAt?.toISOString() ?? null,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
