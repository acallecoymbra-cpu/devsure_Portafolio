import { DataSource } from 'typeorm';
import { Technology } from '../../../technologies/entities/technology.entity';
import { CreateTechnologies1787616000000 } from '../1787616000000-CreateTechnologies';
import { AddTechnologyIcon1790467200000 } from '../1790467200000-AddTechnologyIcon';

describe('technology icon migration (up/down/up)', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [Technology],
      migrations: [
        CreateTechnologies1787616000000,
        AddTechnologyIcon1790467200000,
      ],
    });
    await dataSource.initialize();
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('adds and removes the icon column up/down/up', async () => {
    await dataSource.runMigrations();
    const columns = async () => (await dataSource.createQueryRunner().getTable('technologies'))?.columns.map((c) => c.name) ?? [];

    expect(await columns()).toEqual(expect.arrayContaining(['icon']));

    await dataSource.undoLastMigration();
    expect(await columns()).not.toEqual(expect.arrayContaining(['icon']));

    await dataSource.runMigrations();
    expect(await columns()).toEqual(expect.arrayContaining(['icon']));
  });

  it('persists and reloads icon through the Technology entity', async () => {
    await dataSource.runMigrations();
    const technologies = dataSource.getRepository(Technology);
    await technologies.save(
      technologies.create({
        name: 'TypeScript',
        slug: 'typescript',
        category: 'lenguajes-programacion',
        iconKey: 'code',
        icon: 'technology-icons/typescript.png',
        featured: false,
        sortOrder: 1,
        publicationStatus: 'published',
        publishedAt: new Date(),
      }),
    );

    const reloaded = await technologies.findOneByOrFail({ slug: 'typescript' });
    expect(reloaded.icon).toBe('technology-icons/typescript.png');
  });
});
