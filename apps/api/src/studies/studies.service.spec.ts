import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { AdminSession } from '../auth/entities/admin-session.entity';
import { seedAdmin } from '../database/seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../database/migrations/1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../database/migrations/1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../database/migrations/1788825600000-AddAdminUsername';
import { CreateStudies1789257600000 } from '../database/migrations/1789257600000-CreateStudies';
import { Study } from './entities/study.entity';
import { StudiesService } from './studies.service';
import { CreateStudyDto } from './dto/study.dto';

describe('StudiesService', () => {
  let dataSource: DataSource;
  let service: StudiesService;
  let ownerId: string;
  let otherOwnerId: string;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, Study],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreateStudies1789257600000,
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

    service = new StudiesService(dataSource.getRepository(Study));
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  function minimalInput(overrides: Partial<CreateStudyDto> = {}): CreateStudyDto {
    return Object.assign(new CreateStudyDto(), { institution: 'MIT', title: { en: 'Computer Science' }, ...overrides });
  }

  it('creates a study with the owner injected and defaults applied', async () => {
    const created = await service.create(ownerId, minimalInput());
    expect(created).toMatchObject({
      institution: 'MIT',
      title: { en: 'Computer Science' },
      description: {},
      endDate: null,
      inProgress: false,
      sortOrder: 0,
    });
    expect(created).not.toHaveProperty('field');
    expect(created).not.toHaveProperty('logo');
  });

  it('clears endDate when inProgress is true, even if an endDate was submitted', async () => {
    const created = await service.create(ownerId, minimalInput({ inProgress: true, endDate: '2026-01-01' }));
    expect(created.inProgress).toBe(true);
    expect(created.endDate).toBeNull();
  });

  it('scopes list/get/update/delete to the owner', async () => {
    const mine = await service.create(ownerId, minimalInput());
    await service.create(otherOwnerId, minimalInput({ institution: 'Theirs' }));

    const list = await service.list(ownerId, { page: 1, limit: 50 });
    expect(list.meta.total).toBe(1);

    await expect(service.get(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update(otherOwnerId, mine.id, { institution: 'Hijacked' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.remove(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates only the provided fields and re-clears endDate if inProgress flips to true without a new endDate', async () => {
    const created = await service.create(ownerId, minimalInput({ endDate: '2020-01-01' }));
    const updated = await service.update(ownerId, created.id, { inProgress: true });

    expect(updated.inProgress).toBe(true);
    expect(updated.endDate).toBeNull();
    expect(updated.institution).toBe('MIT');
  });

  it('deletes a study for its owner', async () => {
    const created = await service.create(ownerId, minimalInput());
    await service.remove(ownerId, created.id);
    await expect(service.get(ownerId, created.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});
