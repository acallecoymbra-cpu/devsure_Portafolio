import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { AdminProfileController } from './admin-profile.controller';
import { AdminTranslationsController } from './admin-translations.controller';
import { Profile } from './entities/profile.entity';
import { ProfileService } from './profile.service';
import { TranslationsService } from './translations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Profile, AdminUser]), AuthModule],
  controllers: [AdminProfileController, AdminTranslationsController],
  providers: [ProfileService, TranslationsService],
})
export class ProfileModule {}
