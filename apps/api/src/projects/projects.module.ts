import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { Experience } from '../experiences/entities/experience.entity';
import { SingleOwnerService } from '../common/single-owner.service';
import { AdminProjectsController } from './admin-projects.controller';
import { PublicProjectsController } from './public-projects.controller';
import { Project } from './entities/project.entity';
import { ProjectsService } from './projects.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Experience, AdminUser]), AuthModule],
  controllers: [AdminProjectsController, PublicProjectsController],
  providers: [ProjectsService, SingleOwnerService],
})
export class ProjectsModule {}
