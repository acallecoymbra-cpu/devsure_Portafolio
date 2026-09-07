import { DataSource } from 'typeorm';
import { AdminUser } from '../../../auth/entities/admin-user.entity';
import { AdminSession } from '../../../auth/entities/admin-session.entity';
import { WorkStyleItem } from '../../../work-style-items/entities/work-style-item.entity';
import { seedAdmin } from '../../seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../1788825600000-AddAdminUsername';
import { CreateWorkStyleItems1789516800000 } from '../1789516800000-CreateWorkStyleItems';

describe('work_style_items migration', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, WorkStyleItem],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreateWorkStyleItems1789516800000,
      ],
    });
    await dataSource.initialize();
    await dataSource.runMigrations();
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('runs the work_style_items migration up/down/up', async () => {
    await expect(tableExists(dataSource, 'work_style_items')).resolves.toBe(true);
    await dataSource.undoLastMigration();
    await expect(tableExists(dataSource, 'work_style_items')).resolves.toBe(false);
    await dataSource.runMigrations();
    await expect(tableExists(dataSource, 'work_style_items')).resolves.toBe(true);
  });

  it('cascades the delete of the owning admin user', async () => {
    const { id: ownerId } = await seedAdmin(dataSource.manager, {
      username: 'eduardo',
      email: 'eduardo@example.com',
      password: 'correct-horse-battery',
    });

    const items = dataSource.getRepository(WorkStyleItem);
    await items.save(items.create({ ownerId, text: { en: 'We listen first.' } }));

    await dataSource.getRepository(AdminUser).delete({ id: ownerId });
    await expect(items.count()).resolves.toBe(0);
  });
});

async function tableExists(dataSource: DataSource, tableName: string): Promise<boolean> {
  return dataSource.createQueryRunner().hasTable(tableName);
}
