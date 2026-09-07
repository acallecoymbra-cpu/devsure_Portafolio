import { Body, Controller, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiCookieAuth, ApiCreatedResponse, ApiHeader, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import { AdminGuard, OriginGuard, SessionGuard } from '../auth/auth.guards';
import { UploadFolderDto, UploadResultDto } from './dto/upload.dto';
import { MAX_UPLOAD_BYTES } from './upload-folders';
import { UploadsService } from './uploads.service';

@ApiTags('admin uploads') @ApiCookieAuth()
@ApiHeader({ name: 'x-csrf-token', description: 'Required for mutations', required: false })
@Controller('admin/uploads') @UseGuards(OriginGuard, SessionGuard, AdminGuard)
export class AdminUploadsController {
  constructor(private readonly service: UploadsService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ type: UploadResultDto })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES } }))
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: UploadFolderDto,
    @Req() request: Request,
  ) {
    return this.service.store(body.folder, file, request);
  }
}
