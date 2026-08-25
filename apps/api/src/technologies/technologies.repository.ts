import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Technology } from './entities/technology.entity';

export interface PublicTechnologySearch {
  page: number;
  limit: number;
  featured?: boolean;
  category?: string;
  search?: string;
}

export interface PublicTechnologyPage {
  items: Technology[];
  total: number;
}

@Injectable()
export class TechnologiesRepository {
  constructor(
    @InjectRepository(Technology)
    private readonly repository: Repository<Technology>,
  ) {}

  async findPublished(query: PublicTechnologySearch): Promise<PublicTechnologyPage> {
    const builder = this.repository
      .createQueryBuilder('technology')
      .where('technology.publicationStatus = :publicationStatus', {
        publicationStatus: 'published',
      });

    if (query.featured !== undefined) {
      builder.andWhere('technology.featured = :featured', { featured: query.featured });
    }

    if (query.category !== undefined) {
      builder.andWhere('technology.category = :category', { category: query.category });
    }

    if (query.search !== undefined) {
      builder.andWhere(
        "(LOWER(technology.name) LIKE :search ESCAPE '\\' OR LOWER(COALESCE(technology.summary, '')) LIKE :search ESCAPE '\\')",
        {
          search: `%${escapeLikePattern(query.search.toLowerCase())}%`,
        },
      );
    }

    const [items, total] = await builder
      .orderBy('technology.sortOrder', 'ASC')
      .addOrderBy('technology.name', 'ASC')
      .addOrderBy('technology.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return { items, total };
  }
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}
