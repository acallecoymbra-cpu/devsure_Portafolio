import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdminSocialLinksController } from './admin-social-links.controller';
import { SocialLink } from './entities/social-link.entity';
import { SocialLinksService } from './social-links.service';

@Module({
  imports: [TypeOrmModule.forFeature([SocialLink]), AuthModule],
  controllers: [AdminSocialLinksController],
  providers: [SocialLinksService],
  exports: [SocialLinksService],
})
export class SocialLinksModule {}
