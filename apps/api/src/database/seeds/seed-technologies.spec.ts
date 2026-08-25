import { DataSource } from 'typeorm';
import { Technology } from '../../technologies/entities/technology.entity';
import { CreateTechnologies1787616000000 } from '../migrations/1787616000000-CreateTechnologies';
import { InitialFoundation1700000000000 } from '../migrations/1700000000000-InitialFoundation';
import { seedTechnologies } from './seed-technologies';
import { TECHNOLOGY_SEED_DATA } from './technology.seed-data';

describe('technology migrations and seed', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [Technology],
      migrations: [InitialFoundation1700000000000, CreateTechnologies1787616000000],
    });
    await dataSource.initialize();
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('runs the technology migration up/down/up on an empty database', async () => {
    await dataSource.runMigrations();
    await expect(tableExists(dataSource, 'technologies')).resolves.toBe(true);

    await dataSource.undoLastMigration();
    await expect(tableExists(dataSource, 'technologies')).resolves.toBe(false);

    await dataSource.runMigrations();
    await expect(tableExists(dataSource, 'technologies')).resolves.toBe(true);
  });

  it('seeds the exact catalog repeatedly without duplicates or invented summaries', async () => {
    await dataSource.runMigrations();

    const first = await seedTechnologies(dataSource.manager);
    const second = await seedTechnologies(dataSource.manager);
    const technologies = await dataSource.getRepository(Technology).find({
      order: { sortOrder: 'ASC' },
    });

    expect(first).toMatchObject({ inserted: 41, updated: 0, unchanged: 0, total: 41 });
    expect(second).toMatchObject({ inserted: 0, updated: 0, unchanged: 41, total: 41 });
    expect(technologies).toHaveLength(41);
    expect(technologies.map(({ name }) => name)).toEqual(
      TECHNOLOGY_SEED_DATA.map(({ name }) => name),
    );
    expect(technologies.every(({ summary }) => summary === null)).toBe(true);
    expect(technologies.every(({ featured }) => featured === false)).toBe(true);
    expect(new Set(technologies.map(({ slug }) => slug)).size).toBe(41);
    expect(new Set(technologies.map(({ publishedAt }) => publishedAt?.toISOString())).size).toBe(1);
  });

  it('enforces unique lowercase slugs and valid published records', async () => {
    await dataSource.runMigrations();
    await seedTechnologies(dataSource.manager);
    const repository = dataSource.getRepository(Technology);

    await expect(
      repository.save(
        repository.create({
          id: '10000000-0000-4000-8000-000000000001',
          name: 'Duplicate Java',
          slug: 'java',
          category: 'lenguajes-programacion',
          summary: null,
          iconKey: 'code',
          featured: false,
          sortOrder: 99,
          publicationStatus: 'published',
          publishedAt: new Date('2026-08-25T00:00:00.000Z'),
        }),
      ),
    ).rejects.toThrow();

    await expect(
      repository.save(
        repository.create({
          id: '10000000-0000-4000-8000-000000000002',
          name: 'Uppercase slug',
          slug: 'Uppercase',
          category: 'lenguajes-programacion',
          summary: null,
          iconKey: 'code',
          featured: false,
          sortOrder: 100,
          publicationStatus: 'draft',
        }),
      ),
    ).rejects.toThrow();
  });
});

async function tableExists(dataSource: DataSource, tableName: string): Promise<boolean> {
  return dataSource.createQueryRunner().hasTable(tableName);
}
