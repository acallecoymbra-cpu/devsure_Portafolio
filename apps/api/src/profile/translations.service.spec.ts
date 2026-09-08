import { DataSource } from 'typeorm';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { AdminSession } from '../auth/entities/admin-session.entity';
import { seedAdmin } from '../database/seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../database/migrations/1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../database/migrations/1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../database/migrations/1788825600000-AddAdminUsername';
import { CreateProfiles1788912000000 } from '../database/migrations/1788912000000-CreateProfiles';
import { AddProfileTranslations1788998400000 } from '../database/migrations/1788998400000-AddProfileTranslations';
import { AddProfileStats1789948800000 } from '../database/migrations/1789948800000-AddProfileStats';
import { Profile } from './entities/profile.entity';
import { TranslationsService } from './translations.service';

describe('TranslationsService', () => {
  let dataSource: DataSource;
  let service: TranslationsService;
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
        AddProfileStats1789948800000,
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

    service = new TranslationsService(dataSource.getRepository(Profile), dataSource.getRepository(AdminUser));
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('returns all-empty translations (except the optional heroTag) on first read', async () => {
    const translations = await service.get(ownerId);

    expect(translations).not.toHaveProperty('heroTag');
    expect(translations.heroTitle).toEqual({});
    expect(translations.aboutBody).toEqual({});
    expect(translations.contactIntro).toEqual({});

    // A second read must not create a second profile row.
    await service.get(ownerId);
    await expect(dataSource.getRepository(Profile).count()).resolves.toBe(1);
  });

  it('updates a subset of sections without touching the others', async () => {
    const first = await service.update(ownerId, {
      heroTag: 'WEB APPS / LARAVEL',
      heroTitle: { en: 'Building reliable systems', es: 'Construyendo sistemas confiables' },
      heroCopy: { en: 'I ship backend systems that hold up under load.' },
    });

    expect(first).toMatchObject({
      heroTag: 'WEB APPS / LARAVEL',
      heroTitle: { en: 'Building reliable systems', es: 'Construyendo sistemas confiables' },
      heroCopy: { en: 'I ship backend systems that hold up under load.' },
      aboutHeading: {},
    });

    const second = await service.update(ownerId, {
      aboutHeading: { en: 'About me' },
    });

    // Hero fields from the earlier update must survive an unrelated update.
    expect(second).toMatchObject({
      heroTag: 'WEB APPS / LARAVEL',
      heroTitle: { en: 'Building reliable systems', es: 'Construyendo sistemas confiables' },
      aboutHeading: { en: 'About me' },
    });
  });

  it('persists the profile shared with ProfileService (same underlying row)', async () => {
    await service.update(ownerId, { faqHeading: { en: 'FAQ' } });
    const profiles = dataSource.getRepository(Profile);
    const rows = await profiles.find();
    expect(rows).toHaveLength(1);
    expect(rows[0].ownerId).toBe(ownerId);
    expect(rows[0].faqHeading).toEqual({ en: 'FAQ' });
  });
});
