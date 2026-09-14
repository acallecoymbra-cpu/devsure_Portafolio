import { DataSource } from 'typeorm';
import { AdminUser } from '../../../auth/entities/admin-user.entity';
import { AdminSession } from '../../../auth/entities/admin-session.entity';
import { SocialLink } from '../../../social-links/entities/social-link.entity';
import { seedAdmin } from '../../seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../1788825600000-AddAdminUsername';
import { CreateSocialLinks1790553600000 } from '../1790553600000-CreateSocialLinks';

describe('social links migration', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, SocialLink],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreateSocialLinks1790553600000,
      ],
    });
    await dataSource.initialize();
    await dataSource.runMigrations();
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('runs the social_links migration up/down/up', async () => {
    await expect(tableExists(dataSource, 'social_links')).resolves.toBe(true);
    await dataSource.undoLastMigration();
    await expect(tableExists(dataSource, 'social_links')).resolves.toBe(false);
    await dataSource.runMigrations();
    await expect(tableExists(dataSource, 'social_links')).resolves.toBe(true);
  });

  it('cascades the delete of the owning admin user', async () => {
    const { id: ownerId } = await seedAdmin(dataSource.manager, {
      username: 'eduardo',
      email: 'eduardo@example.com',
      password: 'correct-horse-battery',
    });

    const socialLinks = dataSource.getRepository(SocialLink);
    await socialLinks.save(
      socialLinks.create({ ownerId, name: 'LinkedIn', url: 'https://linkedin.com/company/devsure', iconKey: 'linkedin' }),
    );

    await dataSource.getRepository(AdminUser).delete({ id: ownerId });
    await expect(socialLinks.count()).resolves.toBe(0);
  });
});

async function tableExists(dataSource: DataSource, tableName: string): Promise<boolean> {
  return dataSource.createQueryRunner().hasTable(tableName);
}
