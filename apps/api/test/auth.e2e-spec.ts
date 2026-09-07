import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { seedAdmin } from '../src/database/seeds/seed-admin';

describe('Admin auth (e2e)', () => {
  let app: INestApplication;
  const ORIGIN = 'http://localhost:3000';

  beforeAll(async () => {
    // Raise the login rate limit so this suite's sequential requests never trip it.
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

  it('rejects login with an unknown username', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Origin', ORIGIN)
      .send({ username: 'ghost', password: 'whatever-password' })
      .expect(401);

    expect(response.body.code).toBe('HTTP_401');
  });

  it('rejects login with the wrong password', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Origin', ORIGIN)
      .send({ username: 'eduardo', password: 'not-the-password' })
      .expect(401);
  });

  it('rejects malformed usernames before touching the database', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Origin', ORIGIN)
      .send({ username: 'ed uardo!', password: 'whatever-password' })
      .expect(400);

    expect(response.body.code).toBe('HTTP_400');
  });

  it('logs in with username, forces a password change, and manages the session lifecycle', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Origin', ORIGIN)
      .send({ username: 'eduardo', password: 'correct-horse-battery' })
      .expect(200);

    expect(loginResponse.body.user).toMatchObject({
      username: 'eduardo',
      email: 'eduardo@example.com',
      role: 'ADMIN',
      mustChangePassword: true,
    });
    expect(loginResponse.body.user).not.toHaveProperty('passwordHash');

    const cookie = extractSessionCookie(loginResponse);
    const csrfToken = loginResponse.body.csrfToken as string;

    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', cookie)
      .expect(200);
    expect(me.body.user.username).toBe('eduardo');

    const changeResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/change-password')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send({ currentPassword: 'correct-horse-battery', newPassword: 'a-new-strong-password' })
      .expect(200);

    expect(changeResponse.body.user.mustChangePassword).toBe(false);
    const newCookie = extractSessionCookie(changeResponse);
    const newCsrfToken = changeResponse.body.csrfToken as string;

    // Changing the password revokes every prior session for the user.
    await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', cookie).expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Origin', ORIGIN)
      .set('Cookie', newCookie)
      .set('x-csrf-token', newCsrfToken)
      .expect(204);

    await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', newCookie).expect(401);
  });

  it('rejects mutations without a matching CSRF token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Origin', ORIGIN)
      .send({ username: 'eduardo', password: 'a-new-strong-password' })
      .expect(200);
    const cookie = extractSessionCookie(loginResponse);

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .expect(403);
  });
});

function extractSessionCookie(response: request.Response): string {
  const setCookie = response.headers['set-cookie'] as unknown as string[] | undefined;
  const sessionCookie = setCookie?.find((entry) => entry.startsWith('devsure_session='));
  if (!sessionCookie) throw new Error('Session cookie missing from response');
  return sessionCookie.split(';')[0];
}
