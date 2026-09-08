import type { PublicPortfolio } from '@devsure/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { ProfileService } from '../profile/profile.service';
import { TranslationsService } from '../profile/translations.service';
import { ClientLogosService } from '../client-logos/client-logos.service';
import { ExperiencesService } from '../experiences/experiences.service';
import { ProjectsService } from '../projects/projects.service';
import { StudiesService } from '../studies/studies.service';
import { ServicesService } from '../services/services.service';
import { StrengthsService } from '../strengths/strengths.service';
import { WorkStyleItemsService } from '../work-style-items/work-style-items.service';
import { FaqsService } from '../faqs/faqs.service';
import { TestimonialsService } from '../testimonials/testimonials.service';
import { PostsService } from '../posts/posts.service';

const LIST_ALL = { page: 1, limit: 50 } as const;
/** Home page shows recent posts only (spec §9). */
const RECENT_POSTS_LIMIT = 3;

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(AdminUser) private readonly users: Repository<AdminUser>,
    private readonly profile: ProfileService,
    private readonly translations: TranslationsService,
    private readonly clientLogos: ClientLogosService,
    private readonly experiences: ExperiencesService,
    private readonly projects: ProjectsService,
    private readonly studies: StudiesService,
    private readonly services: ServicesService,
    private readonly strengths: StrengthsService,
    private readonly workStyleItems: WorkStyleItemsService,
    private readonly faqs: FaqsService,
    private readonly testimonials: TestimonialsService,
    private readonly posts: PostsService,
  ) {}

  async get(): Promise<PublicPortfolio> {
    const [owner] = await this.users.find({ order: { createdAt: 'ASC' }, take: 1 });
    if (!owner) throw new NotFoundException();
    const ownerId = owner.id;

    // Profile and Translations back onto the same `profiles` row, and each
    // get-or-creates it on first read. Read Profile first, sequentially, so
    // a first-ever read doesn't race two concurrent inserts of that row
    // (TypeORM opens a transaction per `save()`; two overlapping on the same
    // sqlite connection stepped on each other here).
    const profile = await this.profile.get(ownerId);

    const [
      translations,
      clientLogos,
      experiences,
      projects,
      studies,
      services,
      strengths,
      workStyleItems,
      faqs,
      testimonials,
      posts,
    ] = await Promise.all([
      this.translations.get(ownerId),
      this.clientLogos.listAll(ownerId),
      this.experiences.list(ownerId, LIST_ALL).then((page) => page.items),
      this.projects.list(ownerId, { ...LIST_ALL, featured: true, published: 'published' }).then((page) => page.items),
      this.studies.list(ownerId, LIST_ALL).then((page) => page.items),
      this.services.list(ownerId, LIST_ALL).then((page) => page.items),
      this.strengths.list(ownerId, LIST_ALL).then((page) => page.items),
      this.workStyleItems.list(ownerId, LIST_ALL).then((page) => page.items),
      this.faqs.list(ownerId, LIST_ALL).then((page) => page.items),
      this.testimonials.list(ownerId, LIST_ALL).then((page) => page.items),
      this.posts
        .list(ownerId, { ...LIST_ALL, limit: RECENT_POSTS_LIMIT, published: 'published' })
        .then((page) => page.items),
    ]);

    return {
      profile,
      translations,
      clientLogos,
      experiences,
      projects,
      studies,
      services,
      strengths,
      workStyleItems,
      faqs,
      testimonials,
      posts,
    };
  }
}
