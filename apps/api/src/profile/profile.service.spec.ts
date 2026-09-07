import { BadRequestException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { AdminSession } from '../auth/entities/admin-session.entity';
import { seedAdmin } from '../database/seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../database/migrations/1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../database/migrations/1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../database/migrations/1788825600000-AddAdminUsername';
import { CreateProfiles1788912000000 } from '../database/migrations/1788912000000-CreateProfiles';
import { AddProfileTranslations1788998400000 } from '../database/migrations/1788998400000-AddProfileTranslations';
import { Profile } from './entities/profile.entity';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let dataSource: DataSource;
  let service: ProfileService;
  let ownerId: string;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, Profile],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreateProfiles1788912000000,
        AddProfileTranslations1788998400000,
      ],
    });
    await dataSource.initialize();
    await dataSource.runMigrations();

    const admin = await seedAdmin(dataSource.manager, {
      username: 'eduardo',
      email: 'eduardo@example.com',
      password: 'correct-horse-battery',
    });
    ownerId = admin.id;

    service = new ProfileService(
      dataSource.getRepository(Profile),
      dataSource.getRepository(AdminUser),
      dataSource,
    );
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('creates a default profile from the username on first read', async () => {
    const profile = await service.get(ownerId);

    expect(profile).toMatchObject({
      username: 'eduardo',
      email: 'eduardo@example.com',
      name: 'eduardo',
      headline: {},
      bio: {},
      resume: {},
      activeLocales: ['en'],
      defaultLocale: 'en',
    });
    expect(profile).not.toHaveProperty('fullName');
    expect(profile).not.toHaveProperty('avatar');

    // A second read must not create a second row.
    await service.get(ownerId);
    await expect(dataSource.getRepository(Profile).count()).resolves.toBe(1);
  });

  it('updates identity, translatable content, and locale settings end to end', async () => {
    const updated = await service.update(ownerId, {
      name: 'Eduardo Calle',
      fullName: 'Eduardo Calle Coymbra',
      email: 'eduardo.calle@example.com',
      headline: { en: 'Backend engineer', es: 'Ingeniero backend' },
      bio: { en: 'Building reliable systems.' },
      avatar: 'avatars/eduardo.webp',
      resume: { en: 'resumes/eduardo-en.pdf', es: 'resumes/eduardo-es.pdf' },
      activeLocales: ['en', 'es'],
      defaultLocale: 'es',
    });

    expect(updated).toEqual({
      id: expect.any(String),
      username: 'eduardo',
      email: 'eduardo.calle@example.com',
      name: 'Eduardo Calle',
      fullName: 'Eduardo Calle Coymbra',
      headline: { en: 'Backend engineer', es: 'Ingeniero backend' },
      bio: { en: 'Building reliable systems.' },
      avatar: 'avatars/eduardo.webp',
      resume: { en: 'resumes/eduardo-en.pdf', es: 'resumes/eduardo-es.pdf' },
      activeLocales: ['en', 'es'],
      defaultLocale: 'es',
    });

    const persisted = await service.get(ownerId);
    expect(persisted).toEqual(updated);
  });

  it('rejects a defaultLocale that is not part of the resulting activeLocales', async () => {
    await expect(
      service.update(ownerId, { activeLocales: ['en'], defaultLocale: 'es' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    // The rejected update must not have partially persisted.
    const profile = await service.get(ownerId);
    expect(profile.activeLocales).toEqual(['en']);
    expect(profile.defaultLocale).toBe('en');
  });

  it('rejects updating the email to one already used by another admin', async () => {
    await seedAdmin(dataSource.manager, {
      username: 'other',
      email: 'taken@example.com',
      password: 'correct-horse-battery',
    });

    await expect(service.update(ownerId, { email: 'taken@example.com' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
