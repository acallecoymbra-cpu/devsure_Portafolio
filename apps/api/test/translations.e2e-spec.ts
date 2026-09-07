import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { seedAdmin } from '../src/database/seeds/seed-admin';

describe('Admin translations (e2e)', () => {
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

  it('rejects unauthenticated access', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/translations').expect(401);
  });

  it('returns empty translations by default', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/admin/translations')
      .set('Cookie', cookie)
      .expect(200);

    expect(response.body).not.toHaveProperty('heroTag');
    expect(response.body.heroTitle).toEqual({});
    expect(response.body.contactIntro).toEqual({});
  });

  it('rejects mutations without a matching CSRF token', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/admin/translations')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .send({ heroTag: 'WEB APPS / LARAVEL' })
      .expect(403);
  });

  it('rejects a translatable field with an unsupported locale key', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/admin/translations')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send({ heroTitle: { xx: 'Not a real locale' } })
      .expect(400);
  });

  it('rejects a heading value beyond its max length', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/admin/translations')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send({ heroTitle: { en: 'x'.repeat(151) } })
      .expect(400);
  });

  it('updates a section and persists it across requests without affecting other sections', async () => {
    const first = await request(app.getHttpServer())
      .patch('/api/v1/admin/translations')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send({
        heroTag: 'WEB APPS / LARAVEL',
        heroTitle: { en: 'Building reliable systems', es: 'Construyendo sistemas confiables' },
      })
      .expect(200);

    expect(first.body).toMatchObject({
      heroTag: 'WEB APPS / LARAVEL',
      heroTitle: { en: 'Building reliable systems', es: 'Construyendo sistemas confiables' },
    });

    const second = await request(app.getHttpServer())
      .patch('/api/v1/admin/translations')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .send({ faqHeading: { en: 'FAQ' } })
      .expect(200);

    expect(second.body).toMatchObject({
      heroTag: 'WEB APPS / LARAVEL',
      heroTitle: { en: 'Building reliable systems', es: 'Construyendo sistemas confiables' },
      faqHeading: { en: 'FAQ' },
    });

    const reread = await request(app.getHttpServer())
      .get('/api/v1/admin/translations')
      .set('Cookie', cookie)
      .expect(200);
    expect(reread.body).toEqual(second.body);
  });
});

function extractSessionCookie(response: request.Response): string {
  const setCookie = response.headers['set-cookie'] as unknown as string[] | undefined;
  const sessionCookie = setCookie?.find((entry) => entry.startsWith('devsure_session='));
  if (!sessionCookie) throw new Error('Session cookie missing from response');
  return sessionCookie.split(';')[0];
}
