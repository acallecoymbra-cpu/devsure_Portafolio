import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { AdminSession } from '../auth/entities/admin-session.entity';
import { seedAdmin } from '../database/seeds/seed-admin';
import { CULTURE_PILLAR_SEED_DATA, seedCulturePillars } from '../database/seeds/seed-culture-pillars';
import { CreateAdminAuth1788480000000 } from '../database/migrations/1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../database/migrations/1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../database/migrations/1788825600000-AddAdminUsername';
import { CreateCulturePillars1790899200000 } from '../database/migrations/1790899200000-CreateCulturePillars';
import { CulturePillar } from './entities/culture-pillar.entity';
import { CulturePillarsService } from './culture-pillars.service';
import { CreateCulturePillarDto } from './dto/culture-pillar.dto';

describe('CulturePillarsService', () => {
  let dataSource: DataSource;
  let service: CulturePillarsService;
  let ownerId: string;
  let otherOwnerId: string;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, CulturePillar],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreateCulturePillars1790899200000,
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

    service = new CulturePillarsService(dataSource.getRepository(CulturePillar));
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  function minimalInput(overrides: Partial<CreateCulturePillarDto> = {}): CreateCulturePillarDto {
    return Object.assign(new CreateCulturePillarDto(), {
      title: 'Integridad',
      description: 'Hacemos lo correcto, incluso cuando nadie está mirando.',
      visual: 'integrity',
      ...overrides,
    });
  }

  it('creates a pillar with the owner injected and defaults applied', async () => {
    const created = await service.create(ownerId, minimalInput());
    expect(created).toMatchObject({ title: 'Integridad', keywords: '', visual: 'integrity', sortOrder: 0 });
  });

  it('lists pillars ordered by sortOrder, scoped to the owner', async () => {
    await service.create(ownerId, minimalInput({ sortOrder: 2, title: 'Segundo' }));
    await service.create(ownerId, minimalInput({ sortOrder: 1, title: 'Primero' }));
    await service.create(otherOwnerId, minimalInput({ title: 'Ajeno' }));

    const list = await service.list(ownerId, { page: 1, limit: 50 });
    expect(list.meta.total).toBe(2);
    expect(list.items.map((item) => item.title)).toEqual(['Primero', 'Segundo']);
  });

  it('scopes get/update/delete to the owner', async () => {
    const mine = await service.create(ownerId, minimalInput());
    await service.create(otherOwnerId, minimalInput());

    await expect(service.get(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update(otherOwnerId, mine.id, { title: 'Hijacked' })).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates only the provided fields', async () => {
    const created = await service.create(ownerId, minimalInput({ keywords: 'A · B' }));
    const updated = await service.update(ownerId, created.id, { description: 'Nuevo texto.', visual: 'respect' });

    expect(updated).toMatchObject({ title: 'Integridad', keywords: 'A · B', description: 'Nuevo texto.', visual: 'respect' });
  });

  it('deletes a pillar for its owner', async () => {
    const created = await service.create(ownerId, minimalInput());
    await service.remove(ownerId, created.id);
    await expect(service.get(ownerId, created.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('seeds the six default pillars once (idempotent)', async () => {
    const first = await seedCulturePillars(dataSource.manager, ownerId);
    const second = await seedCulturePillars(dataSource.manager, ownerId);

    expect(first).toEqual({ inserted: CULTURE_PILLAR_SEED_DATA.length, unchanged: 0, total: 6 });
    expect(second).toEqual({ inserted: 0, unchanged: 6, total: 6 });
  });
});
