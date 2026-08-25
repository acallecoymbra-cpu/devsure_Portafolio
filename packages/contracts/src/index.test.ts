import { describe, expect, it } from 'vitest';
import type {
  HealthResponse,
  PaginatedResponse,
  PublicErrorResponse,
  TechnologyCard,
} from './index';

describe('public contracts', () => {
  it('exposes the foundation response shapes', () => {
    const health: HealthResponse = {
      status: 'ok',
      service: 'devsure-api',
      timestamp: new Date().toISOString(),
    };
    const error: PublicErrorResponse = {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request',
    };

    expect(health.status).toBe('ok');
    expect(error.statusCode).toBe(400);
  });

  it('exposes the paginated technology card contract', () => {
    const technology: TechnologyCard = {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'TypeScript',
      slug: 'typescript',
      category: 'lenguajes-programacion',
      iconKey: 'code',
      featured: false,
      sortOrder: 1,
    };
    const response: PaginatedResponse<TechnologyCard> = {
      items: [technology],
      meta: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      },
    };

    expect(response.items[0]).toEqual(technology);
    expect(response.meta.totalPages).toBe(1);
  });
});
