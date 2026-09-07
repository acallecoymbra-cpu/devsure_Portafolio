import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Experience } from '../experiences/entities/experience.entity';
import { AdminProjectsController } from './admin-projects.controller';
import { Project } from './entities/project.entity';
import { ProjectsService } from './projects.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Experience]), AuthModule],
  controllers: [AdminProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
