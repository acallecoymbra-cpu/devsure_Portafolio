import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { AdminSession } from '../auth/entities/admin-session.entity';
import { seedAdmin } from '../database/seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../database/migrations/1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../database/migrations/1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../database/migrations/1788825600000-AddAdminUsername';
import { CreateSocialLinks1790553600000 } from '../database/migrations/1790553600000-CreateSocialLinks';
import { SocialLink } from './entities/social-link.entity';
import { SocialLinksService } from './social-links.service';
import { CreateSocialLinkDto } from './dto/social-link.dto';

describe('SocialLinksService', () => {
  let dataSource: DataSource;
  let service: SocialLinksService;
  let ownerId: string;
  let otherOwnerId: string;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, SocialLink],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreateSocialLinks1790553600000,
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

    service = new SocialLinksService(dataSource.getRepository(SocialLink));
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  function minimalInput(overrides: Partial<CreateSocialLinkDto> = {}): CreateSocialLinkDto {
    return Object.assign(new CreateSocialLinkDto(), {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/company/devsure',
      iconKey: 'linkedin',
      ...overrides,
    });
  }

  it('creates a social link with the owner injected and defaults applied', async () => {
    const created = await service.create(ownerId, minimalInput());
    expect(created).toMatchObject({ name: 'LinkedIn', iconKey: 'linkedin', sortOrder: 0 });
    expect(created).not.toHaveProperty('icon');
  });

  it('creates a social link with the optional uploaded icon', async () => {
    const created = await service.create(ownerId, minimalInput({ icon: 'network-icons/custom.png', sortOrder: 3 }));
    expect(created).toMatchObject({ icon: 'network-icons/custom.png', sortOrder: 3 });
  });

  it('scopes list/get/update/delete to the owner', async () => {
    const mine = await service.create(ownerId, minimalInput());
    await service.create(otherOwnerId, minimalInput({ name: 'Theirs' }));

    const list = await service.list(ownerId, { page: 1, limit: 50 });
    expect(list.meta.total).toBe(1);

    await expect(service.get(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update(otherOwnerId, mine.id, { name: 'Hijacked' })).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists every link for the owner via listAll, unpaginated', async () => {
    await service.create(ownerId, minimalInput({ name: 'A', sortOrder: 1 }));
    await service.create(ownerId, minimalInput({ name: 'B', sortOrder: 0 }));
    await service.create(otherOwnerId, minimalInput({ name: 'Theirs' }));

    const all = await service.listAll(ownerId);
    expect(all.map((link) => link.name)).toEqual(['B', 'A']);
  });

  it('updates only the provided fields', async () => {
    const created = await service.create(ownerId, minimalInput());
    const updated = await service.update(ownerId, created.id, { sortOrder: 7 });

    expect(updated.sortOrder).toBe(7);
    expect(updated.name).toBe('LinkedIn');
  });

  it('deletes a social link for its owner', async () => {
    const created = await service.create(ownerId, minimalInput());
    await service.remove(ownerId, created.id);
    await expect(service.get(ownerId, created.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});
