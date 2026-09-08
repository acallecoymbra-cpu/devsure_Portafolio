import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { seedAdmin } from '../src/database/seeds/seed-admin';

describe('Public portfolio (e2e)', () => {
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

  it('requires no authentication', async () => {
    await request(app.getHttpServer()).get('/api/v1/portfolio').expect(200);
  });

  it('aggregates every content module for the site owner', async () => {
    await admin('patch', '/api/v1/admin/profile').send({ name: 'DevSure', stats: [{ value: 8, suffix: '+', label: { en: 'Years' } }] }).expect(200);
    await admin('patch', '/api/v1/admin/translations').send({ heroTitle: { en: 'Reliable software' } }).expect(200);
    await admin('post', '/api/v1/admin/client-logos').send({ name: 'Acme Inc.', logo: 'client-logos/acme.png' }).expect(201);
    await admin('post', '/api/v1/admin/experiences')
      .send({ company: 'Acme Corp', levels: [{ role: 'Backend Engineer', startDate: '2024-01-01' }] })
      .expect(201);
    const featuredProject = await admin('post', '/api/v1/admin/projects')
      .send({
        title: { en: 'Acme App' },
        apps: [{ name: 'Web App', platform: 'Web' }],
        featured: true,
        publishedAt: new Date().toISOString(),
      })
      .expect(201);
    await admin('post', '/api/v1/admin/projects')
      .send({ title: { en: 'Draft App' }, apps: [{ name: 'Web App', platform: 'Web' }] })
      .expect(201);
    await admin('post', '/api/v1/admin/studies')
      .send({ institution: 'MIT', title: { en: 'Computer Science' } })
      .expect(201);
    await admin('post', '/api/v1/admin/services')
      .send({ title: { en: 'Web apps' }, description: { en: 'Accessible web apps.' } })
      .expect(201);
    await admin('post', '/api/v1/admin/strengths')
      .send({ label: { en: 'Trusted' }, title: { en: 'Proven experience' }, body: { en: '10 years shipping.' } })
      .expect(201);
    await admin('post', '/api/v1/admin/work-style-items').send({ text: { en: 'We plan together.' } }).expect(201);
    await admin('post', '/api/v1/admin/faqs')
      .send({ question: { en: 'Remote?' }, answer: { en: 'Yes.' } })
      .expect(201);
    await admin('post', '/api/v1/admin/testimonials').send({ author: 'Jane Doe', quote: 'Great work.' }).expect(201);
    await admin('post', '/api/v1/admin/posts')
      .send({ title: { en: 'Shipping faster' }, content: { en: '<p>Body</p>' }, publishedAt: new Date().toISOString() })
      .expect(201);

    const response = await request(app.getHttpServer()).get('/api/v1/portfolio').expect(200);

    expect(response.body.profile).toMatchObject({ name: 'DevSure', stats: [{ value: 8, suffix: '+', label: { en: 'Years' } }] });
    expect(response.body.translations).toMatchObject({ heroTitle: { en: 'Reliable software' } });
    expect(response.body.clientLogos).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Acme Inc.' })]),
    );
    expect(response.body.experiences).toEqual(
      expect.arrayContaining([expect.objectContaining({ company: 'Acme Corp' })]),
    );
    // Only the featured + published project is in the public aggregate.
    expect(response.body.projects).toEqual([expect.objectContaining({ id: featuredProject.body.id })]);
    expect(response.body.studies).toEqual(
      expect.arrayContaining([expect.objectContaining({ institution: 'MIT' })]),
    );
    expect(response.body.services).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: { en: 'Web apps' } })]),
    );
    expect(response.body.strengths).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: { en: 'Trusted' } })]),
    );
    expect(response.body.workStyleItems).toEqual(
      expect.arrayContaining([expect.objectContaining({ text: { en: 'We plan together.' } })]),
    );
    expect(response.body.faqs).toEqual(
      expect.arrayContaining([expect.objectContaining({ question: { en: 'Remote?' } })]),
    );
    expect(response.body.testimonials).toEqual(
      expect.arrayContaining([expect.objectContaining({ author: 'Jane Doe' })]),
    );
    expect(response.body.posts).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: { en: 'Shipping faster' } })]),
    );
  });
});

function extractSessionCookie(response: request.Response): string {
  const setCookie = response.headers['set-cookie'] as unknown as string[] | undefined;
  const sessionCookie = setCookie?.find((entry) => entry.startsWith('devsure_session='));
  if (!sessionCookie) throw new Error('Session cookie missing from response');
  return sessionCookie.split(';')[0];
}
