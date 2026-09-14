import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { seedAdmin } from '../src/database/seeds/seed-admin';

describe('Admin social links (e2e)', () => {
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

  function validSocialLink(overrides: Record<string, unknown> = {}) {
    return { name: 'LinkedIn', url: 'https://www.linkedin.com/company/devsure', iconKey: 'linkedin', ...overrides };
  }

  it('rejects unauthenticated access', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/social-links').expect(401);
  });

  it('rejects a social link with an empty name', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/social-links')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send(validSocialLink({ name: '   ' }))
      .expect(400);
  });

  it('rejects a url without a protocol', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/social-links')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send(validSocialLink({ url: 'linkedin.com/company/devsure' }))
      .expect(400);
  });

  it('creates a social link with the optional uploaded icon', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/social-links')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send(validSocialLink({ icon: 'network-icons/custom.png' }))
      .expect(201);

    expect(response.body).toMatchObject({ name: 'LinkedIn', icon: 'network-icons/custom.png', sortOrder: 0 });
  });

  it('lists, updates, and deletes the social link end to end', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/admin/social-links')
      .set('Cookie', cookie)
      .expect(200);
    expect(list.body.meta.total).toBeGreaterThanOrEqual(1);
    const created = list.body.items[0];

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/admin/social-links/${created.id}`)
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send({ sortOrder: 1 })
      .expect(200);
    expect(updated.body).toMatchObject({ id: created.id, sortOrder: 1 });

    await request(app.getHttpServer())
      .delete(`/api/v1/admin/social-links/${created.id}`)
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/v1/admin/social-links/${created.id}`)
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
