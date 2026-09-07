import { BadRequestException, PayloadTooLargeException, UnsupportedMediaTypeException } from '@nestjs/common';
import type { StorageService } from './storage.service';
import { UploadsService } from './uploads.service';

function fakeFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'avatar.webp',
    encoding: '7bit',
    mimetype: 'image/webp',
    size: 1024,
    buffer: Buffer.from('fake-bytes'),
    destination: '',
    filename: '',
    path: '',
    stream: undefined as never,
    ...overrides,
  };
}

describe('UploadsService', () => {
  const request = { protocol: 'http', get: () => 'localhost:3001' } as never;

  function serviceWith(storage: Partial<StorageService>): UploadsService {
    return new UploadsService(storage as StorageService);
  }

  it('rejects when no file was submitted', async () => {
    const service = serviceWith({});
    await expect(service.store('avatars', undefined, request)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a mimetype outside the folder allowlist', async () => {
    const service = serviceWith({});
    await expect(
      service.store('avatars', fakeFile({ mimetype: 'application/pdf' }), request),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
  });

  it('accepts a pdf for resumes but rejects it for avatars', async () => {
    const write = jest.fn().mockResolvedValue('resumes/abc.pdf');
    const service = serviceWith({ write, publicUrl: () => 'http://localhost:3001/storage/resumes/abc.pdf' });
    await expect(
      service.store('resumes', fakeFile({ mimetype: 'application/pdf', size: 1024 }), request),
    ).resolves.toMatchObject({ path: 'resumes/abc.pdf' });
  });

  it('rejects a file larger than the folder limit', async () => {
    const service = serviceWith({});
    await expect(
      service.store('avatars', fakeFile({ size: 3 * 1024 * 1024 }), request),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);
  });

  it('allows network-icons svg up to its own (smaller) limit', async () => {
    const write = jest.fn().mockResolvedValue('network-icons/abc.svg');
    const service = serviceWith({ write, publicUrl: () => 'http://localhost:3001/storage/network-icons/abc.svg' });
    await expect(
      service.store('network-icons', fakeFile({ mimetype: 'image/svg+xml', size: 400 * 1024 }), request),
    ).resolves.toMatchObject({ path: 'network-icons/abc.svg' });

    await expect(
      service.store('network-icons', fakeFile({ mimetype: 'image/svg+xml', size: 600 * 1024 }), request),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);
  });

  it('stores the file and returns the path and public url on success', async () => {
    const write = jest.fn().mockResolvedValue('avatars/generated.webp');
    const publicUrl = jest.fn().mockReturnValue('http://localhost:3001/storage/avatars/generated.webp');
    const service = serviceWith({ write, publicUrl });

    const result = await service.store('avatars', fakeFile(), request);

    expect(write).toHaveBeenCalledWith('avatars', expect.any(Buffer), 'webp');
    expect(result).toEqual({ path: 'avatars/generated.webp', url: 'http://localhost:3001/storage/avatars/generated.webp' });
  });
});
