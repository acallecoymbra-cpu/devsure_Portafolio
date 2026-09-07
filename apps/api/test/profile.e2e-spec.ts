import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { seedAdmin } from '../src/database/seeds/seed-admin';

describe('Admin profile (e2e)', () => {
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
  });

  afterAll(async () => {
    await app.close();
    delete process.env.AUTH_LOGIN_MAX_ATTEMPTS;
  });

  it('blocks profile access before the forced password change', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Origin', ORIGIN)
      .send({ username: 'eduardo', password: 'correct-horse-battery' })
      .expect(200);
    cookie = extractSessionCookie(login);
    csrfToken = login.body.csrfToken as string;

    const blocked = await request(app.getHttpServer())
      .get('/api/v1/admin/profile')
      .set('Cookie', cookie)
      .expect(403);
    expect(blocked.body.code).toBe('PASSWORD_CHANGE_REQUIRED');

    const changed = await request(app.getHttpServer())
      .post('/api/v1/auth/change-password')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send({ currentPassword: 'correct-horse-battery', newPassword: 'a-new-strong-password' })
      .expect(200);
    cookie = extractSessionCookie(changed);
    csrfToken = changed.body.csrfToken as string;
  });

  it('rejects unauthenticated access', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/profile').expect(401);
  });

  it('returns a default profile derived from the username', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/admin/profile')
      .set('Cookie', cookie)
      .expect(200);

    expect(response.body).toMatchObject({
      username: 'eduardo',
      email: 'eduardo@example.com',
      name: 'eduardo',
      headline: {},
      bio: {},
      resume: {},
      activeLocales: ['en'],
      defaultLocale: 'en',
    });
  });

  it('rejects mutations without a matching CSRF token', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/admin/profile')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .send({ name: 'Eduardo Calle' })
      .expect(403);
  });

  it('rejects a defaultLocale outside the submitted activeLocales', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/v1/admin/profile')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send({ activeLocales: ['en'], defaultLocale: 'fr' })
      .expect(400);
    expect(response.body.code).toBe('HTTP_400');
  });

  it('rejects a headline with an unsupported locale key', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/admin/profile')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send({ headline: { xx: 'Not a real locale' } })
      .expect(400);
  });

  it('updates the profile end to end and persists across requests', async () => {
    const updateResponse = await request(app.getHttpServer())
      .patch('/api/v1/admin/profile')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send({
        name: 'Eduardo Calle',
        headline: { en: 'Backend engineer', es: 'Ingeniero backend' },
        activeLocales: ['en', 'es'],
        defaultLocale: 'es',
      })
      .expect(200);

    expect(updateResponse.body).toMatchObject({
      name: 'Eduardo Calle',
      headline: { en: 'Backend engineer', es: 'Ingeniero backend' },
      activeLocales: ['en', 'es'],
      defaultLocale: 'es',
    });

    const reread = await request(app.getHttpServer())
      .get('/api/v1/admin/profile')
      .set('Cookie', cookie)
      .expect(200);
    expect(reread.body).toEqual(updateResponse.body);
  });
});

function extractSessionCookie(response: request.Response): string {
  const setCookie = response.headers['set-cookie'] as unknown as string[] | undefined;
  const sessionCookie = setCookie?.find((entry) => entry.startsWith('devsure_session='));
  if (!sessionCookie) throw new Error('Session cookie missing from response');
  return sessionCookie.split(';')[0];
}
