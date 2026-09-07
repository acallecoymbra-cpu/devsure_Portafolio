import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { AdminSession } from '../auth/entities/admin-session.entity';
import { seedAdmin } from '../database/seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../database/migrations/1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../database/migrations/1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../database/migrations/1788825600000-AddAdminUsername';
import { CreateServices1789344000000 } from '../database/migrations/1789344000000-CreateServices';
import { Service } from './entities/service.entity';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/service.dto';

describe('ServicesService', () => {
  let dataSource: DataSource;
  let service: ServicesService;
  let ownerId: string;
  let otherOwnerId: string;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, Service],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreateServices1789344000000,
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

    service = new ServicesService(dataSource.getRepository(Service));
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  function minimalInput(overrides: Partial<CreateServiceDto> = {}): CreateServiceDto {
    return Object.assign(new CreateServiceDto(), {
      title: { en: 'Web apps' },
      description: { en: 'We build accessible web apps.' },
      ...overrides,
    });
  }

  it('creates a service with the owner injected and defaults applied', async () => {
    const created = await service.create(ownerId, minimalInput());
    expect(created).toMatchObject({ title: { en: 'Web apps' }, sortOrder: 0 });
    expect(created).not.toHaveProperty('icon');
  });

  it('stores the icon when provided', async () => {
    const created = await service.create(ownerId, minimalInput({ icon: 'ti-server' }));
    expect(created.icon).toBe('ti-server');
  });

  it('scopes list/get/update/delete to the owner', async () => {
    const mine = await service.create(ownerId, minimalInput());
    await service.create(otherOwnerId, minimalInput({ title: { en: 'Not mine' } }));

    const list = await service.list(ownerId, { page: 1, limit: 50 });
    expect(list.meta.total).toBe(1);

    await expect(service.get(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update(otherOwnerId, mine.id, { icon: 'ti-hack' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.remove(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates only the provided fields', async () => {
    const created = await service.create(ownerId, minimalInput({ sortOrder: 2 }));
    const updated = await service.update(ownerId, created.id, { icon: 'ti-cloud' });

    expect(updated.icon).toBe('ti-cloud');
    expect(updated.sortOrder).toBe(2);
    expect(updated.title).toEqual({ en: 'Web apps' });
  });

  it('deletes a service for its owner', async () => {
    const created = await service.create(ownerId, minimalInput());
    await service.remove(ownerId, created.id);
    await expect(service.get(ownerId, created.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});
