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
import { AddProfileStats1789948800000 } from '../1789948800000-AddProfileStats';
import { AddProfileFooterFields1790208000000 } from '../1790208000000-AddProfileFooterFields';
import { AddProfileLogoWordmark1790294400000 } from '../1790294400000-AddProfileLogoWordmark';
import { AddProfileHeroVisual1790380800000 } from '../1790380800000-AddProfileHeroVisual';

describe('profile logo wordmark migration (up/down/up)', () => {
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
        AddProfileStats1789948800000,
        AddProfileFooterFields1790208000000,
        AddProfileLogoWordmark1790294400000,
      ],
    });
    await dataSource.initialize();
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('adds and removes the logo_wordmark column up/down/up', async () => {
    await dataSource.runMigrations();
    const columns = async () => (await dataSource.createQueryRunner().getTable('profiles'))?.columns.map((c) => c.name) ?? [];

    expect(await columns()).toEqual(expect.arrayContaining(['logo_wordmark']));

    await dataSource.undoLastMigration();
    expect(await columns()).not.toEqual(expect.arrayContaining(['logo_wordmark']));

    await dataSource.runMigrations();
    expect(await columns()).toEqual(expect.arrayContaining(['logo_wordmark']));
  });

});

describe('profile logo wordmark migration (data integrity, with hero visual applied)', () => {
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
        AddProfileStats1789948800000,
        AddProfileFooterFields1790208000000,
        AddProfileLogoWordmark1790294400000,
        AddProfileHeroVisual1790380800000,
      ],
    });
    await dataSource.initialize();
    await dataSource.runMigrations();
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('persists and reloads logoWordmark through the Profile entity', async () => {
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
        logoWordmark: 'site-logo/devsure-wordmark.png',
      }),
    );

    const reloaded = await profiles.findOneByOrFail({ ownerId });
    expect(reloaded.logoWordmark).toBe('site-logo/devsure-wordmark.png');
  });
});
