import { Technology } from './entities/technology.entity';
import { TechnologiesRepository } from './technologies.repository';
import { TechnologiesService } from './technologies.service';

describe('TechnologiesService', () => {
  it('maps entities to the public contract and calculates pagination', async () => {
    const repository = {
      findPublished: jest.fn().mockResolvedValue({
        items: [technologyFixture()],
        total: 51,
      }),
    } as unknown as TechnologiesRepository;
    const service = new TechnologiesService(repository);

    const response = await service.listPublished({ page: 2, limit: 25 });

    expect(response).toEqual({
      items: [
        {
          id: '00000000-0000-4000-8000-000000000006',
          name: 'TypeScript',
          slug: 'typescript',
          category: 'lenguajes-programacion',
          iconKey: 'code',
          featured: false,
          sortOrder: 6,
        },
      ],
      meta: {
        page: 2,
        limit: 25,
        total: 51,
        totalPages: 3,
      },
    });
    expect(response.items[0]).not.toHaveProperty('publicationStatus');
    expect(response.items[0]).not.toHaveProperty('publishedAt');
  });

  it('reports zero pages for an empty result', async () => {
    const repository = {
      findPublished: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    } as unknown as TechnologiesRepository;
    const service = new TechnologiesService(repository);

    await expect(service.listPublished({ page: 1, limit: 50 })).resolves.toMatchObject({
      items: [],
      meta: { total: 0, totalPages: 0 },
    });
  });
});

function technologyFixture(): Technology {
  return Object.assign(new Technology(), {
    id: '00000000-0000-4000-8000-000000000006',
    name: 'TypeScript',
    slug: 'typescript',
    category: 'lenguajes-programacion',
    summary: null,
    iconKey: 'code',
    featured: false,
    sortOrder: 6,
    publicationStatus: 'published' as const,
    publishedAt: new Date('2026-08-25T00:00:00.000Z'),
    createdAt: new Date('2026-08-25T00:00:00.000Z'),
    updatedAt: new Date('2026-08-25T00:00:00.000Z'),
  });
}
