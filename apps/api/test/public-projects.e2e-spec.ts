import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { seedAdmin } from '../src/database/seeds/seed-admin';

describe('Public projects (e2e)', () => {
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

  function admin(method: 'post' | 'patch', path: string) {
    return request(app.getHttpServer())
      [method](path)
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken);
  }

  it('requires no authentication and excludes drafts', async () => {
    const draft = await admin('post', '/api/v1/admin/projects')
      .send({ title: { en: 'Draft App' }, apps: [{ name: 'Web', platform: 'Web' }], category: 'Web' })
      .expect(201);
    const published = await admin('post', '/api/v1/admin/projects')
      .send({
        title: { en: 'Published App' },
        apps: [{ name: 'Web', platform: 'Web' }],
        category: 'Web',
        publishedAt: new Date().toISOString(),
      })
      .expect(201);

    const list = await request(app.getHttpServer()).get('/api/v1/projects').expect(200);
    const ids = list.body.items.map((item: { id: string }) => item.id);
    expect(ids).toContain(published.body.id);
    expect(ids).not.toContain(draft.body.id);
    for (const item of list.body.items) {
      expect(item.publishedAt).not.toBeNull();
    }
  });

  it('filters by category', async () => {
    const web = await admin('post', '/api/v1/admin/projects')
      .send({
        title: { en: 'Web project' },
        apps: [{ name: 'Web', platform: 'Web' }],
        category: 'Filtro QA',
        publishedAt: new Date().toISOString(),
      })
      .expect(201);
    await admin('post', '/api/v1/admin/projects')
      .send({
        title: { en: 'Other category project' },
        apps: [{ name: 'Web', platform: 'Web' }],
        category: 'Otra categoria',
        publishedAt: new Date().toISOString(),
      })
      .expect(201);

    const filtered = await request(app.getHttpServer())
      .get('/api/v1/projects')
      .query({ category: 'Filtro QA' })
      .expect(200);

    expect(filtered.body.items).toHaveLength(1);
    expect(filtered.body.items[0].id).toBe(web.body.id);
  });

  it('returns 404 for a draft slug and for an unknown slug', async () => {
    const draft = await admin('post', '/api/v1/admin/projects')
      .send({ title: { en: 'Unpublished detail' }, apps: [{ name: 'Web', platform: 'Web' }] })
      .expect(201);

    await request(app.getHttpServer()).get(`/api/v1/projects/${draft.body.slug}`).expect(404);
    await request(app.getHttpServer()).get('/api/v1/projects/no-such-slug').expect(404);
  });

  it('returns the full detail of a published project by slug', async () => {
    const created = await admin('post', '/api/v1/admin/projects')
      .send({
        title: { en: 'Detail project' },
        description: { en: 'Full description.' },
        apps: [{ name: 'Web', platform: 'Web' }],
        techStack: ['Next.js'],
        category: 'Web',
        publishedAt: new Date().toISOString(),
      })
      .expect(201);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/projects/${created.body.slug}`)
      .expect(200);

    expect(detail.body).toMatchObject({
      id: created.body.id,
      slug: created.body.slug,
      category: 'Web',
      techStack: ['Next.js'],
    });
  });
});

function extractSessionCookie(response: request.Response): string {
  const setCookie = response.headers['set-cookie'] as unknown as string[] | undefined;
  const sessionCookie = setCookie?.find((entry) => entry.startsWith('devsure_session='));
  if (!sessionCookie) throw new Error('Session cookie missing from response');
  return sessionCookie.split(';')[0];
}
