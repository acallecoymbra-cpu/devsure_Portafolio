import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdminCultureStoriesController } from './admin-culture-stories.controller';
import { CultureStory } from './entities/culture-story.entity';
import { CultureStoriesService } from './culture-stories.service';

@Module({
  imports: [TypeOrmModule.forFeature([CultureStory]), AuthModule],
  controllers: [AdminCultureStoriesController],
  providers: [CultureStoriesService],
})
export class CultureStoriesModule {}
