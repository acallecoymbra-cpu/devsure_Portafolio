import { DataSource } from 'typeorm';
import { AdminUser } from '../../../auth/entities/admin-user.entity';
import { AdminSession } from '../../../auth/entities/admin-session.entity';
import { Profile } from '../../../profile/entities/profile.entity';
import { CreateAdminAuth1788480000000 } from '../1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../1788825600000-AddAdminUsername';
import { CreateProfiles1788912000000 } from '../1788912000000-CreateProfiles';
import { seedAdmin } from '../../seeds/seed-admin';

describe('profiles migration', () => {
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
      ],
    });
    await dataSource.initialize();
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('runs the profiles migration up/down/up on an empty database', async () => {
    await dataSource.runMigrations();
    await expect(tableExists(dataSource, 'profiles')).resolves.toBe(true);

    await dataSource.undoLastMigration();
    await expect(tableExists(dataSource, 'profiles')).resolves.toBe(false);

    await dataSource.runMigrations();
    await expect(tableExists(dataSource, 'profiles')).resolves.toBe(true);
  });

  it('cascades the delete of the owning admin user and enforces one profile per owner', async () => {
    await dataSource.runMigrations();
    const { id } = await seedAdmin(dataSource.manager, {
      username: 'eduardo',
      email: 'eduardo@example.com',
      password: 'correct-horse-battery',
    });

    const profiles = dataSource.getRepository(Profile);
    await profiles.save(profiles.create({ ownerId: id, name: 'Eduardo', activeLocales: ['en'], defaultLocale: 'en' }));

    await expect(
      profiles.save(profiles.create({ ownerId: id, name: 'Duplicate', activeLocales: ['en'], defaultLocale: 'en' })),
    ).rejects.toThrow();

    await dataSource.getRepository(AdminUser).delete({ id });
    await expect(profiles.count()).resolves.toBe(0);
  });
});

async function tableExists(dataSource: DataSource, tableName: string): Promise<boolean> {
  return dataSource.createQueryRunner().hasTable(tableName);
}
