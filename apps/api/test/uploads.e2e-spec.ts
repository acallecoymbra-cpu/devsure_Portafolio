import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { seedAdmin } from '../src/database/seeds/seed-admin';

describe('Admin uploads (e2e)', () => {
  let app: INestApplication;
  let uploadsDir: string;
  const ORIGIN = 'http://localhost:3000';
  let cookie: string;
  let csrfToken: string;

  beforeAll(async () => {
    process.env.AUTH_LOGIN_MAX_ATTEMPTS = '50';
    uploadsDir = mkdtempSync(join(tmpdir(), 'devsure-uploads-e2e-'));
    process.env.UPLOADS_DIR = uploadsDir;

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
    delete process.env.UPLOADS_DIR;
    rmSync(uploadsDir, { recursive: true, force: true });
  });

  it('rejects unauthenticated uploads', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/uploads')
      .set('Origin', ORIGIN)
      .field('folder', 'avatars')
      .attach('file', Buffer.from('fake-image'), { filename: 'a.png', contentType: 'image/png' })
      .expect(401);
  });

  it('rejects uploads without a matching CSRF token', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/uploads')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .field('folder', 'avatars')
      .attach('file', Buffer.from('fake-image'), { filename: 'a.png', contentType: 'image/png' })
      .expect(403);
  });

  it('rejects an unknown folder', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/uploads')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .field('folder', 'not-a-real-folder')
      .attach('file', Buffer.from('fake-image'), { filename: 'a.png', contentType: 'image/png' })
      .expect(400);
  });

  it('rejects a mimetype outside the folder allowlist', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/uploads')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .field('folder', 'avatars')
      .attach('file', Buffer.from('%PDF-1.4 fake'), { filename: 'a.pdf', contentType: 'application/pdf' })
      .expect(415);
  });

  it('rejects a file larger than the folder limit', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/uploads')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .field('folder', 'network-icons')
      .attach('file', Buffer.alloc(600 * 1024, 1), { filename: 'icon.png', contentType: 'image/png' })
      .expect(413);
  });

  it('uploads an avatar and serves it back from /storage with cross-origin access allowed', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/uploads')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .field('folder', 'avatars')
      .attach('file', Buffer.from('fake-image-bytes'), { filename: 'me.png', contentType: 'image/png' })
      .expect(201);

    expect(response.body.path).toMatch(/^avatars\/[0-9a-f-]{36}\.png$/);
    expect(response.body.url).toContain(`/storage/${response.body.path}`);

    const served = await request(app.getHttpServer())
      .get(`/storage/${response.body.path}`)
      .expect(200);
    expect(Buffer.isBuffer(served.body) ? served.body.toString() : served.text).toBe('fake-image-bytes');
    expect(served.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });

  it('uploads a resume pdf under its own folder and limits', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/uploads')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .set('x-csrf-token', csrfToken)
      .field('folder', 'resumes')
      .attach('file', Buffer.from('%PDF-1.4 fake resume'), { filename: 'cv.pdf', contentType: 'application/pdf' })
      .expect(201);

    expect(response.body.path).toMatch(/^resumes\/[0-9a-f-]{36}\.pdf$/);
  });
});

function extractSessionCookie(response: request.Response): string {
  const setCookie = response.headers['set-cookie'] as unknown as string[] | undefined;
  const sessionCookie = setCookie?.find((entry) => entry.startsWith('devsure_session='));
  if (!sessionCookie) throw new Error('Session cookie missing from response');
  return sessionCookie.split(';')[0];
}
