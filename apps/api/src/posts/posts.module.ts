import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdminPostsController } from './admin-posts.controller';
import { Post } from './entities/post.entity';
import { PostsService } from './posts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), AuthModule],
  controllers: [AdminPostsController],
  providers: [PostsService],
})
export class PostsModule {}
