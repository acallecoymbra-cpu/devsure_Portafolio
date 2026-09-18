import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { AdminSession } from '../auth/entities/admin-session.entity';
import { seedAdmin } from '../database/seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../database/migrations/1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../database/migrations/1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../database/migrations/1788825600000-AddAdminUsername';
import { CreateCultureTeam1790812800000 } from '../database/migrations/1790812800000-CreateCultureTeam';
import { CultureTeamMember } from './entities/culture-team-member.entity';
import { CultureTeamService } from './culture-team.service';
import { CreateCultureTeamMemberDto } from './dto/culture-team-member.dto';

describe('CultureTeamService', () => {
  let dataSource: DataSource;
  let service: CultureTeamService;
  let ownerId: string;
  let otherOwnerId: string;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, CultureTeamMember],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreateCultureTeam1790812800000,
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

    service = new CultureTeamService(dataSource.getRepository(CultureTeamMember));
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  function minimalInput(overrides: Partial<CreateCultureTeamMemberDto> = {}): CreateCultureTeamMemberDto {
    return Object.assign(new CreateCultureTeamMemberDto(), {
      name: 'Persona 01',
      role: 'Dirección general',
      neutralImage: '/photos/professional-office.webp',
      smilingImage: '/photos/professional-office.webp',
      ...overrides,
    });
  }

  it('creates a member with the owner injected and defaults applied', async () => {
    const created = await service.create(ownerId, minimalInput());
    expect(created).toMatchObject({
      name: 'Persona 01',
      role: 'Dirección general',
      neutralImage: '/photos/professional-office.webp',
      smilingImage: '/photos/professional-office.webp',
      sortOrder: 0,
    });
  });

  it('lists members ordered by sortOrder, scoped to the owner', async () => {
    await service.create(ownerId, minimalInput({ sortOrder: 2, name: 'Segunda' }));
    await service.create(ownerId, minimalInput({ sortOrder: 1, name: 'Primera' }));
    await service.create(otherOwnerId, minimalInput({ name: 'Ajena' }));

    const list = await service.list(ownerId, { page: 1, limit: 50 });
    expect(list.meta.total).toBe(2);
    expect(list.items.map((item) => item.name)).toEqual(['Primera', 'Segunda']);
  });

  it('scopes get/update/delete to the owner', async () => {
    const mine = await service.create(ownerId, minimalInput());
    await service.create(otherOwnerId, minimalInput());

    await expect(service.get(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.update(otherOwnerId, mine.id, { name: 'Hijacked' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates only the provided fields', async () => {
    const created = await service.create(ownerId, minimalInput());
    const updated = await service.update(ownerId, created.id, { sortOrder: 5 });

    expect(updated.sortOrder).toBe(5);
    expect(updated.name).toBe('Persona 01');
  });

  it('deletes a member for its owner', async () => {
    const created = await service.create(ownerId, minimalInput());
    await service.remove(ownerId, created.id);
    await expect(service.get(ownerId, created.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});
