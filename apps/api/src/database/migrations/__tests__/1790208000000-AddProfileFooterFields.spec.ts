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

describe('profile footer fields migration (up/down/up)', () => {
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
      ],
    });
    await dataSource.initialize();
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('adds and removes every footer column up/down/up', async () => {
    await dataSource.runMigrations();
    const columns = async () => (await dataSource.createQueryRunner().getTable('profiles'))?.columns.map((c) => c.name) ?? [];

    expect(await columns()).toEqual(
      expect.arrayContaining(['logo', 'phone', 'address', 'business_hours', 'facebook_url', 'linkedin_url', 'footer_about_primary', 'footer_about_secondary']),
    );

    await dataSource.undoLastMigration();
    const afterDown = await columns();
    expect(afterDown).not.toEqual(expect.arrayContaining(['phone']));
    expect(afterDown).toEqual(expect.arrayContaining(['id', 'owner_id', 'name']));

    await dataSource.runMigrations();
    expect(await columns()).toEqual(expect.arrayContaining(['phone', 'footer_about_secondary']));
  });

});

describe('profile footer fields migration (data integrity, with logo wordmark applied)', () => {
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
    await dataSource.runMigrations();
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('persists and reloads footer fields through the Profile entity', async () => {
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
        logo: 'site-logo/devsure.svg',
        phone: '+591 2 2445566',
        address: 'Av. Arce 2856, La Paz, Bolivia',
        businessHours: 'Lunes a viernes, 9:00 a 18:00',
        facebookUrl: 'https://facebook.com/devsure',
        linkedinUrl: 'https://www.linkedin.com/company/devsure',
        footerAboutPrimary: { en: 'DevSure builds reliable software.' },
        footerAboutSecondary: { en: 'We keep engineering clear and maintainable.' },
      }),
    );

    const reloaded = await profiles.findOneByOrFail({ ownerId });
    expect(reloaded.logo).toBe('site-logo/devsure.svg');
    expect(reloaded.phone).toBe('+591 2 2445566');
    expect(reloaded.address).toBe('Av. Arce 2856, La Paz, Bolivia');
    expect(reloaded.businessHours).toBe('Lunes a viernes, 9:00 a 18:00');
    expect(reloaded.facebookUrl).toBe('https://facebook.com/devsure');
    expect(reloaded.linkedinUrl).toBe('https://www.linkedin.com/company/devsure');
    expect(reloaded.footerAboutPrimary).toEqual({ en: 'DevSure builds reliable software.' });
    expect(reloaded.footerAboutSecondary).toEqual({ en: 'We keep engineering clear and maintainable.' });
  });
});
