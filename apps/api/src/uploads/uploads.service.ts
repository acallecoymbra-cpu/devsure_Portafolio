import type { UploadFolder, UploadResult } from '@devsure/contracts';
import { BadRequestException, Injectable, PayloadTooLargeException, UnsupportedMediaTypeException } from '@nestjs/common';
import type { Request } from 'express';
import { FOLDER_CONFIG, extensionFor } from './upload-folders';
import { StorageService } from './storage.service';

@Injectable()
export class UploadsService {
  constructor(private readonly storage: StorageService) {}

  async store(folder: UploadFolder, file: Express.Multer.File | undefined, request: Request): Promise<UploadResult> {
    if (!file) throw new BadRequestException('A file is required.');

    const config = FOLDER_CONFIG[folder];
    if (!config.mimeTypes.includes(file.mimetype)) throw new UnsupportedMediaTypeException();
    if (file.size > config.maxBytes) throw new PayloadTooLargeException();

    const path = await this.storage.write(config.directory, file.buffer, extensionFor(file.mimetype));
    return { path, url: this.storage.publicUrl(request, path) };
  }
}
