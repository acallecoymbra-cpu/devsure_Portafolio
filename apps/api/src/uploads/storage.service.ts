import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { Request } from 'express';

@Injectable()
export class StorageService {
  private readonly root: string;

  constructor(config: ConfigService) {
    this.root = resolve(config.getOrThrow<string>('storage.uploadsDir'));
  }

  /** Writes a buffer under `directory` with a random filename and returns the relative path. */
  async write(directory: string, buffer: Buffer, extension: string): Promise<string> {
    const relativePath = `${directory}/${randomUUID()}.${extension}`;
    const absolutePath = join(this.root, ...relativePath.split('/'));
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer);
    return relativePath;
  }

  publicUrl(request: Request, relativePath: string): string {
    return `${request.protocol}://${request.get('host')}/storage/${relativePath}`;
  }
}
