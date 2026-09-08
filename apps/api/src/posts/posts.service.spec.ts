import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { AdminSession } from '../auth/entities/admin-session.entity';
import { seedAdmin } from '../database/seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../database/migrations/1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../database/migrations/1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../database/migrations/1788825600000-AddAdminUsername';
import { CreatePosts1789776000000 } from '../database/migrations/1789776000000-CreatePosts';
import { Post } from './entities/post.entity';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/post.dto';

describe('PostsService', () => {
  let dataSource: DataSource;
  let service: PostsService;
  let ownerId: string;
  let otherOwnerId: string;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, Post],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreatePosts1789776000000,
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

    service = new PostsService(dataSource.getRepository(Post));
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  function minimalInput(overrides: Partial<CreatePostDto> = {}): CreatePostDto {
    return Object.assign(new CreatePostDto(), {
      title: { en: 'Shipping faster with trunk-based development' },
      content: { en: '<p>Some HTML content.</p>' },
      ...overrides,
    });
  }

  it('auto-generates the slug from the first non-empty title translation', async () => {
    const created = await service.create(ownerId, minimalInput({ title: { es: '', en: 'Hello World' } }));
    expect(created.slug).toBe('hello-world');
  });

  it('treats published_at as null (draft) by default and honors an explicit value', async () => {
    const draft = await service.create(ownerId, minimalInput());
    expect(draft.publishedAt).toBeNull();

    const published = await service.create(
      ownerId,
      minimalInput({ title: { en: 'Published post' }, publishedAt: '2026-01-01T00:00:00.000Z' }),
    );
    expect(published.publishedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('rejects a duplicate slug across owners', async () => {
    await service.create(ownerId, minimalInput({ slug: 'shared-slug' }));
    await expect(
      service.create(otherOwnerId, minimalInput({ title: { en: 'Other' }, slug: 'shared-slug' })),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('stores an optional category and omits it when absent', async () => {
    const withCategory = await service.create(ownerId, minimalInput({ category: 'engineering' }));
    expect(withCategory.category).toBe('engineering');

    const withoutCategory = await service.create(ownerId, minimalInput({ title: { en: 'No category' } }));
    expect(withoutCategory).not.toHaveProperty('category');
  });

  it('filters by owner, published status, and category', async () => {
    const engineering = await service.create(
      ownerId,
      minimalInput({ title: { en: 'Engineering post' }, category: 'engineering', publishedAt: '2026-01-01T00:00:00.000Z' }),
    );
    await service.create(ownerId, minimalInput({ title: { en: 'QA draft' }, category: 'qa' }));
    await service.create(otherOwnerId, minimalInput({ title: { en: 'Not mine' } }));

    const byOwner = await service.list(ownerId, { page: 1, limit: 50 });
    expect(byOwner.meta.total).toBe(2);

    const byCategory = await service.list(ownerId, { page: 1, limit: 50, category: 'engineering' });
    expect(byCategory.items.map((item) => item.id)).toEqual([engineering.id]);

    const published = await service.list(ownerId, { page: 1, limit: 50, published: 'published' });
    expect(published.items.map((item) => item.id)).toEqual([engineering.id]);
  });

  it('scopes get/update/delete to the owner', async () => {
    const mine = await service.create(ownerId, minimalInput());
    await expect(service.get(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update(otherOwnerId, mine.id, { sortOrder: 9 })).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});
