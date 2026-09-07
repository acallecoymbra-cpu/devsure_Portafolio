import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { seedAdmin } from '../src/database/seeds/seed-admin';

describe('Admin projects (e2e)', () => {
  let app: INestApplication;
  const ORIGIN = 'http://localhost:3000';
  let cookie: string;
  let csrfToken: string;

  beforeAll(async () => {
    process.env.AUTH_LOGIN_MAX_ATTEMPTS = '50';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    const dataSource = app.get(DataSource);
    await seedAdmin(dataSource.manager, {
      username: 'eduardo',
      email: 'eduardo@example.com',
      password: 'correct-horse-battery',
    });

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Origin', ORIGIN)
      .send({ username: 'eduardo', password: 'correct-horse-battery' })
      .expect(200);
    const changed = await request(app.getHttpServer())
      .post('/api/v1/auth/change-password')
      .set('Origin', ORIGIN)
      .set('Cookie', extractSessionCookie(login))
      .set('x-csrf-token', login.body.csrfToken as string)
      .send({ currentPassword: 'correct-horse-battery', newPassword: 'a-new-strong-password' })
      .expect(200);
    cookie = extractSessionCookie(changed);
    csrfToken = changed.body.csrfToken as string;
  });

  afterAll(async () => {
    await app.close();
    delete process.env.AUTH_LOGIN_MAX_ATTEMPTS;
  });

  function validProject(overrides: Record<string, unknown> = {}) {
    return {
      title: { en: 'Acme App', es: 'App de Acme' },
      apps: [
        {
          name: 'Web App',
          platform: 'Web',
          techStack: ['Next.js', 'NestJS'],
          links: { Live: 'https://acme.example.com' },
        },
      ],
      ...overrides,
    };
  }

  it('rejects unauthenticated access', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/projects').expect(401);
  });

  it('rejects a project with an empty title', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/projects')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send(validProject({ title: {} }))
      .expect(400);
  });

  it('rejects a repoUrl without a protocol', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/projects')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send(validProject({ repoUrl: 'github.com/acme/app' }))
      .expect(400);
  });

  it('rejects an app link object with too many entries', async () => {
    const links: Record<string, string> = {};
    for (let i = 0; i < 20; i += 1) links[`Link${i}`] = 'https://example.com';

    await request(app.getHttpServer())
      .post('/api/v1/admin/projects')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send(validProject({ apps: [{ name: 'Web', links }] }))
      .expect(400);
  });

  it('creates a project as a draft by default, auto-slugging the title', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/projects')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send(validProject())
      .expect(201);

    expect(response.body).toMatchObject({
      slug: 'acme-app',
      publishedAt: null,
      featured: false,
      apps: validProject().apps,
    });
  });

  it('rejects an experienceId that does not exist', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/projects')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send(validProject({ title: { en: 'Orphan' }, experienceId: '00000000-0000-4000-8000-000000000000' }))
      .expect(400);
  });

  it('caps featured projects at 3, publishes, and deletes end to end', async () => {
    const create = (title: string) =>
      request(app.getHttpServer())
        .post('/api/v1/admin/projects')
        .set('Origin', ORIGIN)
        .set('Cookie', cookie)
        .set('x-csrf-token', csrfToken)
        .send(validProject({ title: { en: title }, featured: true }))
        .expect(201);

    await create('Featured One');
    await create('Featured Two');
    await create('Featured Three');
    const fourth = await create('Featured Four');

    // The exact tiebreak (updated_at DESC, id DESC) is covered deterministically
    // in projects.service.spec.ts; here we only assert the cap itself holds
    // end to end, since sqlite's `datetime` column truncates to whole
    // seconds and these four requests can land within the same second.
    const list = await request(app.getHttpServer())
      .get('/api/v1/admin/projects')
      .set('Cookie', cookie)
      .query({ featured: 'true' })
      .expect(200);
    expect(list.body.meta.total).toBeLessThanOrEqual(3);

    const published = await request(app.getHttpServer())
      .patch(`/api/v1/admin/projects/${fourth.body.id}`)
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send({ publishedAt: '2026-01-01T00:00:00.000Z' })
      .expect(200);
    expect(published.body.publishedAt).toBe('2026-01-01T00:00:00.000Z');

    await request(app.getHttpServer())
      .delete(`/api/v1/admin/projects/${fourth.body.id}`)
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/v1/admin/projects/${fourth.body.id}`)
      .set('Cookie', cookie)
      .expect(404);
  });
});

function extractSessionCookie(response: request.Response): string {
  const setCookie = response.headers['set-cookie'] as unknown as string[] | undefined;
  const sessionCookie = setCookie?.find((entry) => entry.startsWith('devsure_session='));
  if (!sessionCookie) throw new Error('Session cookie missing from response');
  return sessionCookie.split(';')[0];
}
