import type { PaginatedResponse, TechnologyCard } from '@devsure/contracts';
import { Injectable } from '@nestjs/common';
import { ListTechnologiesQueryDto } from './dto/list-technologies-query.dto';
import { Technology } from './entities/technology.entity';
import { TechnologiesRepository } from './technologies.repository';

@Injectable()
export class TechnologiesService {
  constructor(private readonly technologiesRepository: TechnologiesRepository) {}

  async listPublished(query: ListTechnologiesQueryDto): Promise<PaginatedResponse<TechnologyCard>> {
    const { items, total } = await this.technologiesRepository.findPublished(query);

    return {
      items: items.map((technology) => this.toCard(technology)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
      },
    };
  }

  private toCard(technology: Technology): TechnologyCard {
    return {
      id: technology.id,
      name: technology.name,
      slug: technology.slug,
      category: technology.category,
      ...(technology.summary === null ? {} : { summary: technology.summary }),
      iconKey: technology.iconKey,
      featured: technology.featured,
      sortOrder: technology.sortOrder,
    };
  }
}
