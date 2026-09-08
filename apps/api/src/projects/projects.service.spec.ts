import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { AdminSession } from '../auth/entities/admin-session.entity';
import { seedAdmin } from '../database/seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../database/migrations/1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../database/migrations/1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../database/migrations/1788825600000-AddAdminUsername';
import { CreateExperiences1789084800000 } from '../database/migrations/1789084800000-CreateExperiences';
import { CreateProjects1789171200000 } from '../database/migrations/1789171200000-CreateProjects';
import { AddProjectCategory1790035200000 } from '../database/migrations/1790035200000-AddProjectCategory';
import { Experience } from '../experiences/entities/experience.entity';
import { Project } from './entities/project.entity';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/project.dto';

describe('ProjectsService', () => {
  let dataSource: DataSource;
  let service: ProjectsService;
  let ownerId: string;
  let otherOwnerId: string;

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

    ownerId = (
      await seedAdmin(dataSource.manager, { username: 'eduardo', email: 'eduardo@example.com', password: 'correct-horse-battery' })
    ).id;
    otherOwnerId = (
      await seedAdmin(dataSource.manager, { username: 'other', email: 'other@example.com', password: 'correct-horse-battery' })
    ).id;

    service = new ProjectsService(dataSource.getRepository(Project), dataSource.getRepository(Experience));
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  function minimalInput(overrides: Partial<CreateProjectDto> = {}): CreateProjectDto {
    return Object.assign(new CreateProjectDto(), { title: { en: 'Acme App' }, ...overrides });
  }

  it('auto-generates the slug from the first non-empty title translation', async () => {
    const created = await service.create(ownerId, minimalInput({ title: { es: '', en: 'Acme App' } }));
    expect(created.slug).toBe('acme-app');
  });

  it('rejects an experienceId that does not belong to the owner', async () => {
    const experiences = dataSource.getRepository(Experience);
    const foreignExperience = await experiences.save(
      experiences.create({ ownerId: otherOwnerId, company: 'Other Co', slug: 'other-co', levels: [{ role: 'Engineer' }] }),
    );

    await expect(
      service.create(ownerId, minimalInput({ experienceId: foreignExperience.id })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts an experienceId that belongs to the owner', async () => {
    const experiences = dataSource.getRepository(Experience);
    const experience = await experiences.save(
      experiences.create({ ownerId, company: 'Acme', slug: 'acme', levels: [{ role: 'Engineer' }] }),
    );

    const created = await service.create(ownerId, minimalInput({ experienceId: experience.id }));
    expect(created.experienceId).toBe(experience.id);
  });

  it('treats published_at as null (draft) by default and honors an explicit value', async () => {
    const draft = await service.create(ownerId, minimalInput());
    expect(draft.publishedAt).toBeNull();

    const published = await service.create(
      ownerId,
      minimalInput({ title: { en: 'Published App' }, publishedAt: '2026-01-01T00:00:00.000Z' }),
    );
    expect(published.publishedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('filters by owner, experienceId, featured, and published status', async () => {
    const experiences = dataSource.getRepository(Experience);
    const experience = await experiences.save(
      experiences.create({ ownerId, company: 'Acme', slug: 'acme', levels: [{ role: 'Engineer' }] }),
    );

    const linked = await service.create(ownerId, minimalInput({ title: { en: 'Linked' }, experienceId: experience.id, featured: true }));
    await service.create(ownerId, minimalInput({ title: { en: 'Personal' } }));
    await service.create(otherOwnerId, minimalInput({ title: { en: 'Not mine' } }));

    const byOwner = await service.list(ownerId, { page: 1, limit: 50 });
    expect(byOwner.meta.total).toBe(2);

    const byExperience = await service.list(ownerId, { page: 1, limit: 50, experienceId: experience.id });
    expect(byExperience.items.map((item) => item.id)).toEqual([linked.id]);

    const featuredOnly = await service.list(ownerId, { page: 1, limit: 50, featured: true });
    expect(featuredOnly.items.map((item) => item.id)).toEqual([linked.id]);

    const drafts = await service.list(ownerId, { page: 1, limit: 50, published: 'draft' });
    expect(drafts.meta.total).toBe(2);
  });

  it('caps featured projects at 3 per owner, unfeaturing the oldest by updatedAt (spec §9 rule 4)', async () => {
    const first = await service.create(ownerId, minimalInput({ title: { en: 'First' }, featured: true }));
    // sqlite's `datetime` column truncates to whole seconds, so `updated_at`
    // needs a full second of separation for the DESC ordering to be reliable.
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const second = await service.create(ownerId, minimalInput({ title: { en: 'Second' }, featured: true }));
    // sqlite's `datetime` column truncates to whole seconds, so `updated_at`
    // needs a full second of separation for the DESC ordering to be reliable.
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const third = await service.create(ownerId, minimalInput({ title: { en: 'Third' }, featured: true }));
    // sqlite's `datetime` column truncates to whole seconds, so `updated_at`
    // needs a full second of separation for the DESC ordering to be reliable.
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const fourth = await service.create(ownerId, minimalInput({ title: { en: 'Fourth' }, featured: true }));

    const reloadedFirst = await service.get(ownerId, first.id);
    const reloadedSecond = await service.get(ownerId, second.id);
    const reloadedThird = await service.get(ownerId, third.id);
    const reloadedFourth = await service.get(ownerId, fourth.id);

    expect(reloadedFirst.featured).toBe(false);
    expect(reloadedSecond.featured).toBe(true);
    expect(reloadedThird.featured).toBe(true);
    expect(reloadedFourth.featured).toBe(true);
  });

  it('scopes get/update/delete to the owner', async () => {
    const mine = await service.create(ownerId, minimalInput());
    await expect(service.get(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update(otherOwnerId, mine.id, { sortOrder: 9 })).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('persists and updates the optional category', async () => {
    const created = await service.create(ownerId, minimalInput({ category: 'Aplicaciones web' }));
    expect(created.category).toBe('Aplicaciones web');

    const updated = await service.update(ownerId, created.id, { category: 'Automatización' });
    expect(updated.category).toBe('Automatización');
  });

  describe('listPublic / getPublicBySlug', () => {
    it('only returns published projects, optionally filtered by category', async () => {
      const published = await service.create(
        ownerId,
        minimalInput({ title: { en: 'Published' }, category: 'Web', publishedAt: '2026-01-01T00:00:00.000Z' }),
      );
      await service.create(ownerId, minimalInput({ title: { en: 'Draft' }, category: 'Web' }));
      await service.create(
        ownerId,
        minimalInput({ title: { en: 'Other category' }, category: 'QA', publishedAt: '2026-01-01T00:00:00.000Z' }),
      );

      const all = await service.listPublic(ownerId, { page: 1, limit: 50 });
      expect(all.items.map((item) => item.id)).toEqual(
        expect.arrayContaining([published.id]),
      );
      expect(all.items).toHaveLength(2);

      const byCategory = await service.listPublic(ownerId, { page: 1, limit: 50, category: 'Web' });
      expect(byCategory.items.map((item) => item.id)).toEqual([published.id]);
    });

    it('rejects a draft or another owner\'s slug', async () => {
      const draft = await service.create(ownerId, minimalInput({ title: { en: 'Draft' } }));
      await expect(service.getPublicBySlug(ownerId, draft.slug)).rejects.toBeInstanceOf(NotFoundException);

      const published = await service.create(
        otherOwnerId,
        minimalInput({ title: { en: 'Theirs' }, publishedAt: '2026-01-01T00:00:00.000Z' }),
      );
      await expect(service.getPublicBySlug(ownerId, published.slug)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns a published project by slug', async () => {
      const created = await service.create(
        ownerId,
        minimalInput({ title: { en: 'Published' }, publishedAt: '2026-01-01T00:00:00.000Z' }),
      );
      await expect(service.getPublicBySlug(ownerId, created.slug)).resolves.toMatchObject({ id: created.id });
    });
  });
});
