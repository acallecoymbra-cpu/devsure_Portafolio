import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { AdminSession } from '../auth/entities/admin-session.entity';
import { seedAdmin } from '../database/seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../database/migrations/1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../database/migrations/1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../database/migrations/1788825600000-AddAdminUsername';
import { CreateCultureStories1790726400000 } from '../database/migrations/1790726400000-CreateCultureStories';
import { CultureStory } from './entities/culture-story.entity';
import { CultureStoriesService } from './culture-stories.service';
import { CreateCultureStoryDto } from './dto/culture-story.dto';

describe('CultureStoriesService', () => {
  let dataSource: DataSource;
  let service: CultureStoriesService;
  let ownerId: string;
  let otherOwnerId: string;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, CultureStory],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreateCultureStories1790726400000,
      ],
    });
    await dataSource.initialize();
    await dataSource.runMigrations();

    ownerId = (
      await seedAdmin(dataSource.manager, { username: 'eduardo', email: 'eduardo@example.com', password: 'correct-horse-battery' })
    ).id;
    otherOwnerId = (
      await seedAdmin(dataSource.manager, { username: 'other', email: 'other@example.com', password: 'correct-horse-battery' })
    ).id;

    service = new CultureStoriesService(dataSource.getRepository(CultureStory));
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  function minimalInput(overrides: Partial<CreateCultureStoryDto> = {}): CreateCultureStoryDto {
    return Object.assign(new CreateCultureStoryDto(), {
      kicker: { es: '01 · Entender' },
      title: { es: 'Escuchamos antes de construir' },
      description: { es: 'Entendemos el contexto antes de decidir.' },
      imageSrc: '/culture/collaboration.png',
      imageAlt: 'Ilustración de personas conversando.',
      ...overrides,
    });
  }

  it('creates a story with the owner injected and defaults applied', async () => {
    const created = await service.create(ownerId, minimalInput());
    expect(created).toMatchObject({
      kicker: { es: '01 · Entender' },
      title: { es: 'Escuchamos antes de construir' },
      imageSrc: '/culture/collaboration.png',
      imageAlt: 'Ilustración de personas conversando.',
      sortOrder: 0,
    });
  });

  it('lists stories ordered by sortOrder, scoped to the owner', async () => {
    await service.create(ownerId, minimalInput({ sortOrder: 2, title: { es: 'Segunda' } }));
    await service.create(ownerId, minimalInput({ sortOrder: 1, title: { es: 'Primera' } }));
    await service.create(otherOwnerId, minimalInput({ title: { es: 'Ajena' } }));

    const list = await service.list(ownerId, { page: 1, limit: 50 });
    expect(list.meta.total).toBe(2);
    expect(list.items.map((item) => item.title.es)).toEqual(['Primera', 'Segunda']);
  });

  it('scopes get/update/delete to the owner', async () => {
    const mine = await service.create(ownerId, minimalInput());
    await service.create(otherOwnerId, minimalInput());

    await expect(service.get(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.update(otherOwnerId, mine.id, { title: { es: 'Hijacked' } }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates only the provided fields', async () => {
    const created = await service.create(ownerId, minimalInput());
    const updated = await service.update(ownerId, created.id, { sortOrder: 5 });

    expect(updated.sortOrder).toBe(5);
    expect(updated.title).toEqual({ es: 'Escuchamos antes de construir' });
  });

  it('deletes a story for its owner', async () => {
    const created = await service.create(ownerId, minimalInput());
    await service.remove(ownerId, created.id);
    await expect(service.get(ownerId, created.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});
