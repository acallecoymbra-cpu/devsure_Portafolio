import type { UploadFolder, UploadResult } from '@devsure/contracts';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { UPLOAD_FOLDER_KEYS } from '../upload-folders';

export class UploadFolderDto {
  @ApiProperty({ enum: UPLOAD_FOLDER_KEYS })
  @IsIn(UPLOAD_FOLDER_KEYS)
  folder!: UploadFolder;
}

export class UploadResultDto implements UploadResult {
  @ApiProperty() path!: string;
  @ApiProperty() url!: string;
}
