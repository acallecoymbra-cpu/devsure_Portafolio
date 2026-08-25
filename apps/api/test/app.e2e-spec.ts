import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { seedTechnologies } from '../src/database/seeds/seed-technologies';
import { Technology } from '../src/technologies/entities/technology.entity';

describe('API foundation (e2e)', () => {
  let app: INestApplication;
  let technologies: Repository<Technology>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    const dataSource = app.get(DataSource);
    await seedTechnologies(dataSource.manager);
    technologies = dataSource.getRepository(Technology);
    await technologies.save(
      technologies.create({
        id: '10000000-0000-4000-8000-000000000001',
        name: 'Invisible Draft',
        slug: 'invisible-draft',
        category: 'backend-frameworks',
        summary: null,
        iconKey: 'backend',
        featured: true,
        sortOrder: 0,
        publicationStatus: 'draft',
      }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('devsure-api');
  });

  it('lists only the 41 published technology cards in deterministic order', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/technologies').expect(200);

    expect(response.body.meta).toEqual({
      page: 1,
      limit: 50,
      total: 41,
      totalPages: 1,
    });
    expect(response.body.items).toHaveLength(41);
    expect(response.body.items[0]).toMatchObject({ name: 'Java', sortOrder: 1 });
    expect(response.body.items[40]).toMatchObject({ name: 'Postman', sortOrder: 41 });
    expect(
      response.body.items.some(({ slug }: { slug: string }) => slug === 'invisible-draft'),
    ).toBe(false);
    expect(Object.keys(response.body.items[0]).sort()).toEqual(
      ['category', 'featured', 'iconKey', 'id', 'name', 'slug', 'sortOrder'].sort(),
    );
  });

  it('paginates published results with the requested page and limit', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/technologies')
      .query({ page: 2, limit: 10 })
      .expect(200);

    expect(response.body.items).toHaveLength(10);
    expect(response.body.items[0]).toMatchObject({ name: 'Serenity BDD', sortOrder: 11 });
    expect(response.body.meta).toEqual({
      page: 2,
      limit: 10,
      total: 41,
      totalPages: 5,
    });
  });

  it('normalizes and filters by category', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/technologies')
      .query({ category: '  BACKEND-FRAMEWORKS  ' })
      .expect(200);

    expect(response.body.meta.total).toBe(5);
    expect(response.body.items.map(({ name }: { name: string }) => name)).toEqual([
      'Laravel',
      'Vue.js',
      'NestJS',
      'Next.js',
      'Node.js',
    ]);
  });

  it('filters featured records without allowing drafts through', async () => {
    const laravel = await technologies.findOneByOrFail({ slug: 'laravel' });
    await technologies.update(laravel.id, { featured: true });

    try {
      const response = await request(app.getHttpServer())
        .get('/api/v1/technologies')
        .query({ featured: 'true' })
        .expect(200);

      expect(response.body.meta.total).toBe(1);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].slug).toBe('laravel');
    } finally {
      await technologies.update(laravel.id, { featured: false });
    }
  });

  it('searches case-insensitively in trimmed names and optional summaries', async () => {
    const byName = await request(app.getHttpServer())
      .get('/api/v1/technologies')
      .query({ search: '  typescript  ' })
      .expect(200);

    expect(byName.body.items.map(({ slug }: { slug: string }) => slug)).toEqual(['typescript']);

    const typescript = await technologies.findOneByOrFail({ slug: 'typescript' });
    await technologies.update(typescript.id, { summary: 'Tipado seguro para aplicaciones' });

    try {
      const bySummary = await request(app.getHttpServer())
        .get('/api/v1/technologies')
        .query({ search: 'TIPADO SEGURO' })
        .expect(200);

      expect(bySummary.body.items).toHaveLength(1);
      expect(bySummary.body.items[0]).toMatchObject({
        slug: 'typescript',
        summary: 'Tipado seguro para aplicaciones',
      });
    } finally {
      await technologies.update(typescript.id, { summary: null });
    }
  });

  it.each([
    ['page=0', 'page below minimum'],
    ['page=1.5', 'non-integer page'],
    ['limit=51', 'limit above maximum'],
    ['featured=1', 'non-boolean featured'],
    ['category=not%20a%20slug', 'invalid category'],
    ['search=x', 'search below minimum'],
    ['unexpected=true', 'unknown query field'],
  ])('rejects invalid technology query: %s (%s)', async (query) => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/technologies?${query}`)
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'HTTP_400',
      message: 'Bad Request',
    });
  });

  it('allows only configured CORS origins', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:3000')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('serves the OpenAPI document at /docs', async () => {
    await request(app.getHttpServer()).get('/docs').expect(200);
    await request(app.getHttpServer()).get('/docs/').expect(200);
  });

  it('returns a safe envelope for unknown routes', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/health')
      .send({ unexpected: true })
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      code: 'HTTP_404',
      message: 'Not Found',
    });
    expect(response.body).not.toHaveProperty('stack');
  });

  it('returns a safe 413 response when the body exceeds the configured limit', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ payload: 'x'.repeat(11 * 1024) }))
      .expect(413);

    expect(response.body).toMatchObject({
      statusCode: 413,
      code: 'HTTP_413',
      message: 'Payload Too Large',
    });
    expect(response.body).not.toHaveProperty('stack');
  });
});
