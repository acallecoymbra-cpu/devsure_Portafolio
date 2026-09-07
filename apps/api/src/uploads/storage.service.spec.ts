import type { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { StorageService } from './storage.service';

function fakeConfig(uploadsDir: string): ConfigService {
  return { getOrThrow: () => uploadsDir } as unknown as ConfigService;
}

describe('StorageService', () => {
  let root: string;
  let service: StorageService;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'devsure-uploads-'));
    service = new StorageService(fakeConfig(root));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('writes the buffer under the given directory with a random filename and extension', async () => {
    const relativePath = await service.write('avatars', Buffer.from('fake-image-bytes'), 'webp');

    expect(relativePath).toMatch(/^avatars\/[0-9a-f-]{36}\.webp$/);
    await expect(readFile(join(root, ...relativePath.split('/')), 'utf8')).resolves.toBe('fake-image-bytes');
  });

  it('creates nested directories on demand', async () => {
    const relativePath = await service.write('projects/covers', Buffer.from('cover'), 'png');
    expect(relativePath).toMatch(/^projects\/covers\/[0-9a-f-]{36}\.png$/);
    await expect(readFile(join(root, ...relativePath.split('/')), 'utf8')).resolves.toBe('cover');
  });

  it('never collides on repeated writes to the same directory', async () => {
    const first = await service.write('avatars', Buffer.from('a'), 'png');
    const second = await service.write('avatars', Buffer.from('b'), 'png');
    expect(first).not.toBe(second);
  });

  it('builds an absolute public url from the request and the relative path', () => {
    const request = { protocol: 'https', get: () => 'devsure.example' } as never;
    expect(service.publicUrl(request, 'avatars/abc.webp')).toBe('https://devsure.example/storage/avatars/abc.webp');
  });
});
