import * as argon2 from 'argon2';
import { DataSource } from 'typeorm';
import { AdminUser } from '../../auth/entities/admin-user.entity';
import { AdminSession } from '../../auth/entities/admin-session.entity';
import { CreateAdminAuth1788480000000 } from '../migrations/1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../migrations/1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../migrations/1788825600000-AddAdminUsername';
import { seedAdmin } from './seed-admin';

describe('admin seed', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
      ],
    });
    await dataSource.initialize();
    await dataSource.runMigrations();
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('creates the admin user with a hashed password and a forced password change', async () => {
    const result = await seedAdmin(dataSource.manager, {
      username: 'eduardo',
      email: 'eduardo@example.com',
      password: 'correct-horse-battery',
    });

    expect(result.action).toBe('created');

    const user = await dataSource
      .getRepository(AdminUser)
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id: result.id })
      .getOneOrFail();

    expect(user.username).toBe('eduardo');
    expect(user.email).toBe('eduardo@example.com');
    expect(user.mustChangePassword).toBe(true);
    expect(user.passwordHash).not.toBe('correct-horse-battery');
    await expect(argon2.verify(user.passwordHash, 'correct-horse-battery')).resolves.toBe(true);
  });

  it('updates the existing user instead of creating a duplicate when the username matches', async () => {
    const first = await seedAdmin(dataSource.manager, {
      username: 'eduardo',
      email: 'eduardo@example.com',
      password: 'correct-horse-battery',
    });
    const second = await seedAdmin(dataSource.manager, {
      username: 'eduardo',
      email: 'eduardo+new@example.com',
      password: 'another-strong-password',
    });

    expect(second).toEqual({ action: 'updated', id: first.id });
    expect(await dataSource.getRepository(AdminUser).count()).toBe(1);

    const user = await dataSource.getRepository(AdminUser).findOneByOrFail({ id: first.id });
    expect(user.email).toBe('eduardo+new@example.com');
  });

  it('rejects passwords shorter than 12 characters', async () => {
    await expect(
      seedAdmin(dataSource.manager, { username: 'eduardo', email: 'eduardo@example.com', password: 'short' }),
    ).rejects.toThrow(/at least 12 characters/);
  });

  it('enforces unique usernames at the database level', async () => {
    await seedAdmin(dataSource.manager, {
      username: 'eduardo',
      email: 'eduardo@example.com',
      password: 'correct-horse-battery',
    });

    const repository = dataSource.getRepository(AdminUser);
    await expect(
      repository.save(
        repository.create({
          username: 'eduardo',
          email: 'other@example.com',
          passwordHash: await argon2.hash('another-strong-password'),
          role: 'ADMIN',
          isActive: true,
          mustChangePassword: true,
        }),
      ),
    ).rejects.toThrow();
  });
});
