import type { PaginatedResponse, Project as ProjectContract } from '@devsure/contracts';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Experience } from '../experiences/entities/experience.entity';
import { firstTranslatableValue, slugify } from '../common/slugify';
import { Project } from './entities/project.entity';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { ListPublicProjectsQueryDto } from './dto/list-public-projects-query.dto';

const FEATURED_LIMIT = 3;

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly repository: Repository<Project>,
    @InjectRepository(Experience) private readonly experiences: Repository<Experience>,
  ) {}

  async list(ownerId: string, query: ListProjectsQueryDto): Promise<PaginatedResponse<ProjectContract>> {
    const builder = this.repository.createQueryBuilder('project').where('project.ownerId = :ownerId', { ownerId });
    if (query.experienceId !== undefined) {
      builder.andWhere('project.experienceId = :experienceId', { experienceId: query.experienceId });
    }
    if (query.featured !== undefined) builder.andWhere('project.featured = :featured', { featured: query.featured });
    if (query.published === 'draft') builder.andWhere('project.publishedAt IS NULL');
    if (query.published === 'published') builder.andWhere('project.publishedAt IS NOT NULL');
    if (query.category !== undefined) builder.andWhere('project.category = :category', { category: query.category });
    if (query.search !== undefined) {
      builder.andWhere('LOWER(project.title) LIKE :search', { search: `%${query.search.toLowerCase()}%` });
    }
    const [items, total] = await builder
      .orderBy('project.sortOrder', 'ASC')
      .addOrderBy('project.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return {
      items: items.map(toProject),
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async get(ownerId: string, id: string): Promise<ProjectContract> {
    return toProject(await this.entity(ownerId, id));
  }

  /** Public `/casos-de-exito` list: published only, optionally filtered by category. */
  async listPublic(ownerId: string, query: ListPublicProjectsQueryDto): Promise<PaginatedResponse<ProjectContract>> {
    return this.list(ownerId, {
      page: query.page,
      limit: query.limit,
      category: query.category,
      published: 'published',
    } as ListProjectsQueryDto);
  }

  /** Public `/casos-de-exito/[slug]` detail: 404s for drafts and unknown slugs alike, never leaking which. */
  async getPublicBySlug(ownerId: string, slug: string): Promise<ProjectContract> {
    const entity = await this.repository.findOneBy({ ownerId, slug });
    if (!entity || !entity.publishedAt) throw new NotFoundException();
    return toProject(entity);
  }

  async create(ownerId: string, input: CreateProjectDto): Promise<ProjectContract> {
    await this.assertExperienceOwnership(ownerId, input.experienceId);
    const entity = this.repository.create({
      ownerId,
      experienceId: input.experienceId ?? null,
      title: input.title,
      slug: input.slug?.trim() || slugify(firstTranslatableValue(input.title)),
      category: input.category || null,
      excerpt: input.excerpt ?? null,
      description: input.description ?? null,
      coverImage: input.coverImage || null,
      gallery: input.gallery ?? null,
      techStack: input.techStack ?? null,
      apps: input.apps ?? null,
      url: input.url || null,
      repoUrl: input.repoUrl || null,
      featured: input.featured ?? false,
      sortOrder: input.sortOrder ?? 0,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
    });
    return this.persist(entity);
  }

  async update(ownerId: string, id: string, input: UpdateProjectDto): Promise<ProjectContract> {
    const entity = await this.entity(ownerId, id);
    if (input.experienceId !== undefined) {
      await this.assertExperienceOwnership(ownerId, input.experienceId);
      entity.experienceId = input.experienceId;
    }
    if (input.title !== undefined) entity.title = input.title;
    if (input.slug !== undefined) entity.slug = input.slug;
    if (input.category !== undefined) entity.category = input.category || null;
    if (input.excerpt !== undefined) entity.excerpt = input.excerpt ?? null;
    if (input.description !== undefined) entity.description = input.description ?? null;
    if (input.coverImage !== undefined) entity.coverImage = input.coverImage || null;
    if (input.gallery !== undefined) entity.gallery = input.gallery ?? null;
    if (input.techStack !== undefined) entity.techStack = input.techStack ?? null;
    if (input.apps !== undefined) entity.apps = input.apps ?? null;
    if (input.url !== undefined) entity.url = input.url || null;
    if (input.repoUrl !== undefined) entity.repoUrl = input.repoUrl || null;
    if (input.featured !== undefined) entity.featured = input.featured;
    if (input.sortOrder !== undefined) entity.sortOrder = input.sortOrder;
    if (input.publishedAt !== undefined) entity.publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
    return this.persist(entity);
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const result = await this.repository.delete({ id, ownerId });
    if (!result.affected) throw new NotFoundException();
  }

  private async entity(ownerId: string, id: string): Promise<Project> {
    const entity = await this.repository.findOneBy({ id, ownerId });
    if (!entity) throw new NotFoundException();
    return entity;
  }

  private async assertExperienceOwnership(ownerId: string, experienceId: string | null | undefined): Promise<void> {
    if (!experienceId) return;
    const experience = await this.experiences.findOneBy({ id: experienceId, ownerId });
    if (!experience) throw new BadRequestException('experienceId must reference one of your own experiences.');
  }

  /** Spec §9 rule 4: at most 3 featured projects per owner; unfeature the oldest beyond the cap. */
  private async enforceFeaturedCap(ownerId: string): Promise<void> {
    const featured = await this.repository.find({
      where: { ownerId, featured: true },
      order: { updatedAt: 'DESC', id: 'DESC' },
    });
    for (const overflow of featured.slice(FEATURED_LIMIT)) {
      overflow.featured = false;
      await this.repository.save(overflow);
    }
  }

  private async save(entity: Project): Promise<Project> {
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

  private async persist(entity: Project): Promise<ProjectContract> {
    const saved = await this.save(entity);
    if (saved.featured) await this.enforceFeaturedCap(saved.ownerId);
    return toProject(saved);
  }
}

function toProject(entity: Project): ProjectContract {
  return {
    id: entity.id,
    ...(entity.experienceId ? { experienceId: entity.experienceId } : {}),
    title: entity.title,
    slug: entity.slug,
    ...(entity.category ? { category: entity.category } : {}),
    excerpt: entity.excerpt ?? {},
    description: entity.description ?? {},
    ...(entity.coverImage ? { coverImage: entity.coverImage } : {}),
    gallery: entity.gallery ?? [],
    techStack: entity.techStack ?? [],
    apps: entity.apps ?? [],
    ...(entity.url ? { url: entity.url } : {}),
    ...(entity.repoUrl ? { repoUrl: entity.repoUrl } : {}),
    featured: entity.featured,
    sortOrder: entity.sortOrder,
    publishedAt: entity.publishedAt?.toISOString() ?? null,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
