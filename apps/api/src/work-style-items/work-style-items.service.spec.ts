import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { AdminSession } from '../auth/entities/admin-session.entity';
import { seedAdmin } from '../database/seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../database/migrations/1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../database/migrations/1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../database/migrations/1788825600000-AddAdminUsername';
import { CreateWorkStyleItems1789516800000 } from '../database/migrations/1789516800000-CreateWorkStyleItems';
import { WorkStyleItem } from './entities/work-style-item.entity';
import { WorkStyleItemsService } from './work-style-items.service';
import { CreateWorkStyleItemDto } from './dto/work-style-item.dto';

describe('WorkStyleItemsService', () => {
  let dataSource: DataSource;
  let service: WorkStyleItemsService;
  let ownerId: string;
  let otherOwnerId: string;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, WorkStyleItem],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreateWorkStyleItems1789516800000,
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

    service = new WorkStyleItemsService(dataSource.getRepository(WorkStyleItem));
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  function minimalInput(overrides: Partial<CreateWorkStyleItemDto> = {}): CreateWorkStyleItemDto {
    return Object.assign(new CreateWorkStyleItemDto(), { text: { en: 'We listen first.' }, ...overrides });
  }

  it('creates an item with the owner injected and defaults applied', async () => {
    const created = await service.create(ownerId, minimalInput());
    expect(created).toMatchObject({ text: { en: 'We listen first.' }, sortOrder: 0 });
  });

  it('scopes list/get/update/delete to the owner', async () => {
    const mine = await service.create(ownerId, minimalInput());
    await service.create(otherOwnerId, minimalInput({ text: { en: 'Not mine' } }));

    const list = await service.list(ownerId, { page: 1, limit: 50 });
    expect(list.meta.total).toBe(1);

    await expect(service.get(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update(otherOwnerId, mine.id, { sortOrder: 5 })).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates only the provided fields', async () => {
    const created = await service.create(ownerId, minimalInput({ sortOrder: 1 }));
    const updated = await service.update(ownerId, created.id, { text: { en: 'Updated text.' } });

    expect(updated.text).toEqual({ en: 'Updated text.' });
    expect(updated.sortOrder).toBe(1);
  });

  it('deletes an item for its owner', async () => {
    const created = await service.create(ownerId, minimalInput());
    await service.remove(ownerId, created.id);
    await expect(service.get(ownerId, created.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});
