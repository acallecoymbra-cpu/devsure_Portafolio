import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { AdminSession } from '../auth/entities/admin-session.entity';
import { seedAdmin } from '../database/seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../database/migrations/1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../database/migrations/1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../database/migrations/1788825600000-AddAdminUsername';
import { CreateStrengths1789430400000 } from '../database/migrations/1789430400000-CreateStrengths';
import { Strength } from './entities/strength.entity';
import { StrengthsService } from './strengths.service';
import { CreateStrengthDto } from './dto/strength.dto';

describe('StrengthsService', () => {
  let dataSource: DataSource;
  let service: StrengthsService;
  let ownerId: string;
  let otherOwnerId: string;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, Strength],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreateStrengths1789430400000,
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

    service = new StrengthsService(dataSource.getRepository(Strength));
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  function minimalInput(overrides: Partial<CreateStrengthDto> = {}): CreateStrengthDto {
    return Object.assign(new CreateStrengthDto(), {
      label: { en: 'Trusted' },
      title: { en: 'Proven experience' },
      body: { en: '10 years shipping software.' },
      ...overrides,
    });
  }

  it('creates a strength with the owner injected and defaults applied', async () => {
    const created = await service.create(ownerId, minimalInput());
    expect(created).toMatchObject({ label: { en: 'Trusted' }, techStack: [], sortOrder: 0 });
  });

  it('stores techStack when provided', async () => {
    const created = await service.create(ownerId, minimalInput({ techStack: ['Next.js', 'NestJS'] }));
    expect(created.techStack).toEqual(['Next.js', 'NestJS']);
  });

  it('scopes list/get/update/delete to the owner', async () => {
    const mine = await service.create(ownerId, minimalInput());
    await service.create(otherOwnerId, minimalInput({ title: { en: 'Not mine' } }));

    const list = await service.list(ownerId, { page: 1, limit: 50 });
    expect(list.meta.total).toBe(1);

    await expect(service.get(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update(otherOwnerId, mine.id, { sortOrder: 9 })).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates only the provided fields', async () => {
    const created = await service.create(ownerId, minimalInput({ sortOrder: 1 }));
    const updated = await service.update(ownerId, created.id, { techStack: ['Docker'] });

    expect(updated.techStack).toEqual(['Docker']);
    expect(updated.sortOrder).toBe(1);
    expect(updated.label).toEqual({ en: 'Trusted' });
  });

  it('deletes a strength for its owner', async () => {
    const created = await service.create(ownerId, minimalInput());
    await service.remove(ownerId, created.id);
    await expect(service.get(ownerId, created.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});
