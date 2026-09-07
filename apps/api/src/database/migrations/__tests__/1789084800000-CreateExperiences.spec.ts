import { DataSource } from 'typeorm';
import { AdminUser } from '../../../auth/entities/admin-user.entity';
import { AdminSession } from '../../../auth/entities/admin-session.entity';
import { Experience } from '../../../experiences/entities/experience.entity';
import { seedAdmin } from '../../seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../1788825600000-AddAdminUsername';
import { CreateExperiences1789084800000 } from '../1789084800000-CreateExperiences';

describe('experiences migration', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, Experience],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreateExperiences1789084800000,
      ],
    });
    await dataSource.initialize();
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('runs the experiences migration up/down/up on an empty database', async () => {
    await dataSource.runMigrations();
    await expect(tableExists(dataSource, 'experiences')).resolves.toBe(true);

    await dataSource.undoLastMigration();
    await expect(tableExists(dataSource, 'experiences')).resolves.toBe(false);

    await dataSource.runMigrations();
    await expect(tableExists(dataSource, 'experiences')).resolves.toBe(true);
  });

  it('cascades the delete of the owning admin user and enforces a unique slug', async () => {
    await dataSource.runMigrations();
    const { id: ownerId } = await seedAdmin(dataSource.manager, {
      username: 'eduardo',
      email: 'eduardo@example.com',
      password: 'correct-horse-battery',
    });

    const experiences = dataSource.getRepository(Experience);
    await experiences.save(
      experiences.create({ ownerId, company: 'Acme', slug: 'acme', levels: [{ role: 'Engineer' }] }),
    );

    await expect(
      experiences.save(
        experiences.create({ ownerId, company: 'Acme Corp', slug: 'acme', levels: [{ role: 'Engineer' }] }),
      ),
    ).rejects.toThrow();

    await dataSource.getRepository(AdminUser).delete({ id: ownerId });
    await expect(experiences.count()).resolves.toBe(0);
  });
});

async function tableExists(dataSource: DataSource, tableName: string): Promise<boolean> {
  return dataSource.createQueryRunner().hasTable(tableName);
}
