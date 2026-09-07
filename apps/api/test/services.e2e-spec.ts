import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { seedAdmin } from '../src/database/seeds/seed-admin';

describe('Admin services (e2e)', () => {
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

  function validService(overrides: Record<string, unknown> = {}) {
    return {
      title: { en: 'Web apps', es: 'Aplicaciones web' },
      description: { en: 'Accessible web apps.', es: 'Aplicaciones web accesibles.' },
      ...overrides,
    };
  }

  it('rejects unauthenticated access', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/services').expect(401);
  });

  it('rejects a service with an empty description', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/services')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send(validService({ description: {} }))
      .expect(400);
  });

  it('rejects an icon that does not look like a Themify class', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/services')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send(validService({ icon: 'Not Valid!' }))
      .expect(400);
  });

  it('creates a service', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/services')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send(validService({ icon: 'ti-server' }))
      .expect(201);

    expect(response.body).toMatchObject({ icon: 'ti-server', sortOrder: 0 });
  });

  it('lists, updates, and deletes the service end to end', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/admin/services')
      .set('Cookie', cookie)
      .expect(200);
    expect(list.body.meta.total).toBeGreaterThanOrEqual(1);
    const created = list.body.items[0];

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/admin/services/${created.id}`)
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send({ sortOrder: 2 })
      .expect(200);
    expect(updated.body).toMatchObject({ id: created.id, sortOrder: 2 });

    await request(app.getHttpServer())
      .delete(`/api/v1/admin/services/${created.id}`)
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/v1/admin/services/${created.id}`)
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
