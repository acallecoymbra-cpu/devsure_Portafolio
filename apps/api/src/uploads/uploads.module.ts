import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminUploadsController } from './admin-uploads.controller';
import { StorageService } from './storage.service';
import { UploadsService } from './uploads.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminUploadsController],
  providers: [StorageService, UploadsService],
})
export class UploadsModule {}
