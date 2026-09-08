import { DataSource } from 'typeorm';
import { AdminUser } from '../../../auth/entities/admin-user.entity';
import { AdminSession } from '../../../auth/entities/admin-session.entity';
import { Experience } from '../../../experiences/entities/experience.entity';
import { Project } from '../../../projects/entities/project.entity';
import { seedAdmin } from '../../seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../1788825600000-AddAdminUsername';
import { CreateExperiences1789084800000 } from '../1789084800000-CreateExperiences';
import { CreateProjects1789171200000 } from '../1789171200000-CreateProjects';
import { AddProjectCategory1790035200000 } from '../1790035200000-AddProjectCategory';

describe('projects migration (up/down/up)', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, Experience, Project],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreateExperiences1789084800000,
        CreateProjects1789171200000,
      ],
    });
    await dataSource.initialize();
    await dataSource.runMigrations();
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('runs the projects migration up/down/up', async () => {
    await expect(tableExists(dataSource, 'projects')).resolves.toBe(true);
    await dataSource.undoLastMigration();
    await expect(tableExists(dataSource, 'projects')).resolves.toBe(false);
    await dataSource.runMigrations();
    await expect(tableExists(dataSource, 'projects')).resolves.toBe(true);
  });
});

describe('projects migration (data integrity, with category column applied)', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, Experience, Project],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreateExperiences1789084800000,
        CreateProjects1789171200000,
        AddProjectCategory1790035200000,
      ],
    });
    await dataSource.initialize();
    await dataSource.runMigrations();
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('cascades the delete of the owning admin user and enforces a unique slug', async () => {
    const { id: ownerId } = await seedAdmin(dataSource.manager, {
      username: 'eduardo',
      email: 'eduardo@example.com',
      password: 'correct-horse-battery',
    });

    const projects = dataSource.getRepository(Project);
    await projects.save(projects.create({ ownerId, title: { en: 'Acme App' }, slug: 'acme-app' }));

    await expect(
      projects.save(projects.create({ ownerId, title: { en: 'Acme App 2' }, slug: 'acme-app' })),
    ).rejects.toThrow();

    await dataSource.getRepository(AdminUser).delete({ id: ownerId });
    await expect(projects.count()).resolves.toBe(0);
  });

  it('sets experience_id to null instead of deleting the project when its experience is removed', async () => {
    const { id: ownerId } = await seedAdmin(dataSource.manager, {
      username: 'eduardo',
      email: 'eduardo@example.com',
      password: 'correct-horse-battery',
    });
    const experiences = dataSource.getRepository(Experience);
    const experience = await experiences.save(
      experiences.create({ ownerId, company: 'Acme', slug: 'acme', levels: [{ role: 'Engineer' }] }),
    );

    const projects = dataSource.getRepository(Project);
    const project = await projects.save(
      projects.create({ ownerId, experienceId: experience.id, title: { en: 'Client App' }, slug: 'client-app' }),
    );

    await experiences.delete({ id: experience.id });

    const reloaded = await projects.findOneByOrFail({ id: project.id });
    expect(reloaded.experienceId).toBeNull();
  });

  it('persists and reloads the category column through the Project entity', async () => {
    const { id: ownerId } = await seedAdmin(dataSource.manager, {
      username: 'eduardo',
      email: 'eduardo@example.com',
      password: 'correct-horse-battery',
    });

    const projects = dataSource.getRepository(Project);
    const saved = await projects.save(
      projects.create({ ownerId, title: { en: 'Acme App' }, slug: 'acme-app', category: 'Aplicaciones web' }),
    );

    const reloaded = await projects.findOneByOrFail({ id: saved.id });
    expect(reloaded.category).toBe('Aplicaciones web');
  });
});

async function tableExists(dataSource: DataSource, tableName: string): Promise<boolean> {
  return dataSource.createQueryRunner().hasTable(tableName);
}
