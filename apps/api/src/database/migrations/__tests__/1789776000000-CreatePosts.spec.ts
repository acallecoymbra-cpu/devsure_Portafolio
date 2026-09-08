import { DataSource } from 'typeorm';
import { AdminUser } from '../../../auth/entities/admin-user.entity';
import { AdminSession } from '../../../auth/entities/admin-session.entity';
import { Post } from '../../../posts/entities/post.entity';
import { seedAdmin } from '../../seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../1788825600000-AddAdminUsername';
import { CreatePosts1789776000000 } from '../1789776000000-CreatePosts';

describe('posts migration', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, Post],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreatePosts1789776000000,
      ],
    });
    await dataSource.initialize();
    await dataSource.runMigrations();
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('runs the posts migration up/down/up', async () => {
    await expect(tableExists(dataSource, 'posts')).resolves.toBe(true);
    await dataSource.undoLastMigration();
    await expect(tableExists(dataSource, 'posts')).resolves.toBe(false);
    await dataSource.runMigrations();
    await expect(tableExists(dataSource, 'posts')).resolves.toBe(true);
  });

  it('enforces a unique slug', async () => {
    const { id: ownerId } = await seedAdmin(dataSource.manager, {
      username: 'eduardo',
      email: 'eduardo@example.com',
      password: 'correct-horse-battery',
    });

    const posts = dataSource.getRepository(Post);
    await posts.save(posts.create({ ownerId, title: { en: 'Hello' }, slug: 'hello', content: { en: '<p>Hi</p>' } }));
    await expect(
      posts.save(posts.create({ ownerId, title: { en: 'Hello again' }, slug: 'hello', content: { en: '<p>Hi</p>' } })),
    ).rejects.toThrow();
  });

  it('cascades the delete of the owning admin user', async () => {
    const { id: ownerId } = await seedAdmin(dataSource.manager, {
      username: 'jane',
      email: 'jane@example.com',
      password: 'correct-horse-battery',
    });

    const posts = dataSource.getRepository(Post);
    await posts.save(posts.create({ ownerId, title: { en: 'Hello' }, slug: 'hello-2', content: { en: '<p>Hi</p>' } }));

    await dataSource.getRepository(AdminUser).delete({ id: ownerId });
    await expect(posts.count()).resolves.toBe(0);
  });
});

async function tableExists(dataSource: DataSource, tableName: string): Promise<boolean> {
  return dataSource.createQueryRunner().hasTable(tableName);
}
