import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';

describe('API foundation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('devsure-api');
  });

  it('allows only configured CORS origins', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:3000')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000'
    );
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
      message: 'Not Found'
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
      message: 'Payload Too Large'
    });
    expect(response.body).not.toHaveProperty('stack');
  });
});
