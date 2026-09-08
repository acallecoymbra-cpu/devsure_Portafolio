import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { AdminSession } from '../auth/entities/admin-session.entity';
import { seedAdmin } from '../database/seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../database/migrations/1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../database/migrations/1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../database/migrations/1788825600000-AddAdminUsername';
import { CreateClientLogos1789862400000 } from '../database/migrations/1789862400000-CreateClientLogos';
import { ClientLogo } from './entities/client-logo.entity';
import { ClientLogosService } from './client-logos.service';
import { CreateClientLogoDto } from './dto/client-logo.dto';

describe('ClientLogosService', () => {
  let dataSource: DataSource;
  let service: ClientLogosService;
  let ownerId: string;
  let otherOwnerId: string;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, ClientLogo],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreateClientLogos1789862400000,
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

    service = new ClientLogosService(dataSource.getRepository(ClientLogo));
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  function minimalInput(overrides: Partial<CreateClientLogoDto> = {}): CreateClientLogoDto {
    return Object.assign(new CreateClientLogoDto(), { name: 'Acme Inc.', logo: 'client-logos/acme.png', ...overrides });
  }

  it('creates a client logo with the owner injected and defaults applied', async () => {
    const created = await service.create(ownerId, minimalInput());
    expect(created).toMatchObject({ name: 'Acme Inc.', logo: 'client-logos/acme.png', sortOrder: 0 });
    expect(created).not.toHaveProperty('websiteUrl');
  });

  it('creates a client logo with the optional website url', async () => {
    const created = await service.create(ownerId, minimalInput({ websiteUrl: 'https://acme.example', sortOrder: 3 }));
    expect(created).toMatchObject({ websiteUrl: 'https://acme.example', sortOrder: 3 });
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

  it('lists every logo for the owner via listAll, unpaginated', async () => {
    await service.create(ownerId, minimalInput({ name: 'A', sortOrder: 1 }));
    await service.create(ownerId, minimalInput({ name: 'B', sortOrder: 0 }));
    await service.create(otherOwnerId, minimalInput({ name: 'Theirs' }));

    const all = await service.listAll(ownerId);
    expect(all.map((logo) => logo.name)).toEqual(['B', 'A']);
  });

  it('updates only the provided fields', async () => {
    const created = await service.create(ownerId, minimalInput());
    const updated = await service.update(ownerId, created.id, { sortOrder: 7 });

    expect(updated.sortOrder).toBe(7);
    expect(updated.name).toBe('Acme Inc.');
  });

  it('deletes a client logo for its owner', async () => {
    const created = await service.create(ownerId, minimalInput());
    await service.remove(ownerId, created.id);
    await expect(service.get(ownerId, created.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});
