import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { AdminSession } from '../auth/entities/admin-session.entity';
import { seedAdmin } from '../database/seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../database/migrations/1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../database/migrations/1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../database/migrations/1788825600000-AddAdminUsername';
import { CreateExperiences1789084800000 } from '../database/migrations/1789084800000-CreateExperiences';
import { Experience } from './entities/experience.entity';
import { ExperiencesService } from './experiences.service';
import { CreateExperienceDto } from './dto/experience.dto';

describe('ExperiencesService', () => {
  let dataSource: DataSource;
  let service: ExperiencesService;
  let ownerId: string;
  let otherOwnerId: string;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, Experience],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreateExperiences1789084800000,
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

    service = new ExperiencesService(dataSource.getRepository(Experience));
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  function levelInput() {
    return { role: 'Backend Engineer', startDate: '2024-01-01', inProgress: true, description: { en: 'Shipping.' } };
  }

  it('auto-generates the slug from the company name when none is given', async () => {
    const created = await service.create(ownerId, minimalInput({ company: 'Acme Corp' }));
    expect(created.slug).toBe('acme-corp');
  });

  it('respects an explicit slug over the auto-generated one', async () => {
    const created = await service.create(ownerId, minimalInput({ company: 'Acme Corp', slug: 'acme' }));
    expect(created.slug).toBe('acme');
  });

  it('rejects a duplicate slug across owners', async () => {
    await service.create(ownerId, minimalInput({ company: 'Acme', slug: 'acme' }));
    await expect(
      service.create(otherOwnerId, minimalInput({ company: 'Acme Two', slug: 'acme' })),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('round-trips levels (including translatable description and highlights) through JSON storage', async () => {
    const created = await service.create(
      ownerId,
      minimalInput({
        company: 'Acme',
        levels: [
          {
            ...levelInput(),
            highlights: [{ en: 'Shipped X', es: 'Entregué X' }],
          },
        ],
      }),
    );

    expect(created.levels).toEqual([
      {
        role: 'Backend Engineer',
        startDate: '2024-01-01',
        inProgress: true,
        description: { en: 'Shipping.' },
        highlights: [{ en: 'Shipped X', es: 'Entregué X' }],
      },
    ]);
  });

  it('scopes list/get/update/delete to the owner and hides other owners’ experiences', async () => {
    const mine = await service.create(ownerId, minimalInput({ company: 'Mine' }));
    await service.create(otherOwnerId, minimalInput({ company: 'Theirs' }));

    const list = await service.list(ownerId, { page: 1, limit: 50 });
    expect(list.meta.total).toBe(1);
    expect(list.items.map((item) => item.company)).toEqual(['Mine']);

    await expect(service.get(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update(otherOwnerId, mine.id, { company: 'Hijacked' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.remove(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);

    await expect(service.get(ownerId, mine.id)).resolves.toMatchObject({ company: 'Mine' });
  });

  it('updates only the provided fields', async () => {
    const created = await service.create(ownerId, minimalInput({ company: 'Acme', sortOrder: 5 }));
    const updated = await service.update(ownerId, created.id, { company: 'Acme Renamed' });

    expect(updated.company).toBe('Acme Renamed');
    expect(updated.slug).toBe(created.slug);
    expect(updated.sortOrder).toBe(5);
  });

  it('deletes the experience for its owner', async () => {
    const created = await service.create(ownerId, minimalInput({ company: 'Acme' }));
    await service.remove(ownerId, created.id);
    await expect(service.get(ownerId, created.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  function minimalInput(overrides: Partial<CreateExperienceDto> = {}): CreateExperienceDto {
    return Object.assign(new CreateExperienceDto(), {
      company: 'Acme',
      levels: [levelInput()],
      ...overrides,
    });
  }
});
