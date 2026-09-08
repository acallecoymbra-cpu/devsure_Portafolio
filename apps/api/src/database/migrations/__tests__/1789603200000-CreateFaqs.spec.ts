import { DataSource } from 'typeorm';
import { AdminUser } from '../../../auth/entities/admin-user.entity';
import { AdminSession } from '../../../auth/entities/admin-session.entity';
import { Faq } from '../../../faqs/entities/faq.entity';
import { seedAdmin } from '../../seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../1788825600000-AddAdminUsername';
import { CreateFaqs1789603200000 } from '../1789603200000-CreateFaqs';

describe('faqs migration', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, Faq],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreateFaqs1789603200000,
      ],
    });
    await dataSource.initialize();
    await dataSource.runMigrations();
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('runs the faqs migration up/down/up', async () => {
    await expect(tableExists(dataSource, 'faqs')).resolves.toBe(true);
    await dataSource.undoLastMigration();
    await expect(tableExists(dataSource, 'faqs')).resolves.toBe(false);
    await dataSource.runMigrations();
    await expect(tableExists(dataSource, 'faqs')).resolves.toBe(true);
  });

  it('cascades the delete of the owning admin user', async () => {
    const { id: ownerId } = await seedAdmin(dataSource.manager, {
      username: 'eduardo',
      email: 'eduardo@example.com',
      password: 'correct-horse-battery',
    });

    const faqs = dataSource.getRepository(Faq);
    await faqs.save(faqs.create({ ownerId, question: { en: 'Do you work remotely?' }, answer: { en: 'Yes.' } }));

    await dataSource.getRepository(AdminUser).delete({ id: ownerId });
    await expect(faqs.count()).resolves.toBe(0);
  });
});

async function tableExists(dataSource: DataSource, tableName: string): Promise<boolean> {
  return dataSource.createQueryRunner().hasTable(tableName);
}
