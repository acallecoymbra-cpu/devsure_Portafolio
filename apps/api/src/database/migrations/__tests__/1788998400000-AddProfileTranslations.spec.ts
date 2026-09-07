import { DataSource } from 'typeorm';
import { AdminUser } from '../../../auth/entities/admin-user.entity';
import { AdminSession } from '../../../auth/entities/admin-session.entity';
import { Profile } from '../../../profile/entities/profile.entity';
import { seedAdmin } from '../../seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../1788825600000-AddAdminUsername';
import { CreateProfiles1788912000000 } from '../1788912000000-CreateProfiles';
import { AddProfileTranslations1788998400000 } from '../1788998400000-AddProfileTranslations';

describe('profile translations migration', () => {
  let dataSource: DataSource;

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
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('adds and removes every translation column up/down/up', async () => {
    await dataSource.runMigrations();
    const columns = async () => (await dataSource.createQueryRunner().getTable('profiles'))?.columns.map((c) => c.name) ?? [];

    expect(await columns()).toEqual(expect.arrayContaining(['hero_tag', 'hero_title', 'about_body', 'contact_intro']));

    await dataSource.undoLastMigration();
    const afterDown = await columns();
    expect(afterDown).not.toEqual(expect.arrayContaining(['hero_tag']));
    expect(afterDown).toEqual(expect.arrayContaining(['id', 'owner_id', 'name']));

    await dataSource.runMigrations();
    expect(await columns()).toEqual(expect.arrayContaining(['hero_tag', 'contact_intro']));
  });

  it('persists and reloads translation fields through the Profile entity', async () => {
    await dataSource.runMigrations();
    const { id: ownerId } = await seedAdmin(dataSource.manager, {
      username: 'eduardo',
      email: 'eduardo@example.com',
      password: 'correct-horse-battery',
    });

    const profiles = dataSource.getRepository(Profile);
    await profiles.save(
      profiles.create({
        ownerId,
        name: 'Eduardo',
        activeLocales: ['en'],
        defaultLocale: 'en',
        heroTag: 'WEB APPS / LARAVEL',
        heroTitle: { en: 'Building reliable systems' },
        aboutBody: { en: 'Backend engineer.', es: 'Ingeniero backend.' },
      }),
    );

    const reloaded = await profiles.findOneByOrFail({ ownerId });
    expect(reloaded.heroTag).toBe('WEB APPS / LARAVEL');
    expect(reloaded.heroTitle).toEqual({ en: 'Building reliable systems' });
    expect(reloaded.aboutBody).toEqual({ en: 'Backend engineer.', es: 'Ingeniero backend.' });
    expect(reloaded.contactIntro).toBeNull();
  });
});
