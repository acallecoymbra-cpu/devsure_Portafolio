import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { seedAdmin } from '../src/database/seeds/seed-admin';

describe('Admin strengths (e2e)', () => {
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

  function validStrength(overrides: Record<string, unknown> = {}) {
    return {
      label: { en: 'Trusted' },
      title: { en: 'Proven experience' },
      body: { en: '10 years shipping software.' },
      ...overrides,
    };
  }

  it('rejects unauthenticated access', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/strengths').expect(401);
  });

  it('rejects a strength with an empty body', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/strengths')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send(validStrength({ body: {} }))
      .expect(400);
  });

  it('creates a strength with techStack', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/strengths')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send(validStrength({ techStack: ['Next.js', 'NestJS'] }))
      .expect(201);

    expect(response.body).toMatchObject({ techStack: ['Next.js', 'NestJS'], sortOrder: 0 });
  });

  it('lists, updates, and deletes the strength end to end', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/admin/strengths')
      .set('Cookie', cookie)
      .expect(200);
    expect(list.body.meta.total).toBeGreaterThanOrEqual(1);
    const created = list.body.items[0];

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/admin/strengths/${created.id}`)
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send({ sortOrder: 3 })
      .expect(200);
    expect(updated.body).toMatchObject({ id: created.id, sortOrder: 3 });

    await request(app.getHttpServer())
      .delete(`/api/v1/admin/strengths/${created.id}`)
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/v1/admin/strengths/${created.id}`)
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
