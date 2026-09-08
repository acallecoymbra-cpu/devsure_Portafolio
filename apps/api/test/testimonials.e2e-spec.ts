import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { seedAdmin } from '../src/database/seeds/seed-admin';

describe('Admin testimonials (e2e)', () => {
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

  function validTestimonial(overrides: Record<string, unknown> = {}) {
    return { author: 'Jane Doe', quote: 'Great work, on time and on budget.', ...overrides };
  }

  it('rejects unauthenticated access', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/testimonials').expect(401);
  });

  it('rejects a testimonial with an empty quote', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/testimonials')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send(validTestimonial({ quote: '   ' }))
      .expect(400);
  });

  it('rejects an invalid source', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/testimonials')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send(validTestimonial({ source: 'not-a-source' }))
      .expect(400);
  });

  it('rejects a sourceUrl without a protocol', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/testimonials')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send(validTestimonial({ sourceUrl: 'linkedin.com/in/jane' }))
      .expect(400);
  });

  it('creates a testimonial with optional fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/testimonials')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send(validTestimonial({ role: 'CTO', company: 'Acme Inc.', source: 'linkedin', sourceUrl: 'https://linkedin.com/in/jane' }))
      .expect(201);

    expect(response.body).toMatchObject({
      author: 'Jane Doe',
      role: 'CTO',
      company: 'Acme Inc.',
      source: 'linkedin',
      sourceUrl: 'https://linkedin.com/in/jane',
      sortOrder: 0,
    });
  });

  it('lists, updates, and deletes the testimonial end to end', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/admin/testimonials')
      .set('Cookie', cookie)
      .expect(200);
    expect(list.body.meta.total).toBeGreaterThanOrEqual(1);
    const created = list.body.items[0];

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/admin/testimonials/${created.id}`)
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send({ sortOrder: 1 })
      .expect(200);
    expect(updated.body).toMatchObject({ id: created.id, sortOrder: 1 });

    await request(app.getHttpServer())
      .delete(`/api/v1/admin/testimonials/${created.id}`)
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/v1/admin/testimonials/${created.id}`)
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
