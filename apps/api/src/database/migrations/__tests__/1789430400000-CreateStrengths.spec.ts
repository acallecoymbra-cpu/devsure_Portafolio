import { DataSource } from 'typeorm';
import { AdminUser } from '../../../auth/entities/admin-user.entity';
import { AdminSession } from '../../../auth/entities/admin-session.entity';
import { Strength } from '../../../strengths/entities/strength.entity';
import { seedAdmin } from '../../seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../1788825600000-AddAdminUsername';
import { CreateStrengths1789430400000 } from '../1789430400000-CreateStrengths';

describe('strengths migration', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, Strength],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreateStrengths1789430400000,
      ],
    });
    await dataSource.initialize();
    await dataSource.runMigrations();
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('runs the strengths migration up/down/up', async () => {
    await expect(tableExists(dataSource, 'strengths')).resolves.toBe(true);
    await dataSource.undoLastMigration();
    await expect(tableExists(dataSource, 'strengths')).resolves.toBe(false);
    await dataSource.runMigrations();
    await expect(tableExists(dataSource, 'strengths')).resolves.toBe(true);
  });

  it('cascades the delete of the owning admin user', async () => {
    const { id: ownerId } = await seedAdmin(dataSource.manager, {
      username: 'eduardo',
      email: 'eduardo@example.com',
      password: 'correct-horse-battery',
    });

    const strengths = dataSource.getRepository(Strength);
    await strengths.save(
      strengths.create({ ownerId, label: { en: 'Trusted' }, title: { en: 'Proven experience' }, body: { en: '10 years.' } }),
    );

    await dataSource.getRepository(AdminUser).delete({ id: ownerId });
    await expect(strengths.count()).resolves.toBe(0);
  });
});

async function tableExists(dataSource: DataSource, tableName: string): Promise<boolean> {
  return dataSource.createQueryRunner().hasTable(tableName);
}
