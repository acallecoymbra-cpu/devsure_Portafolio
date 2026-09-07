import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdminExperiencesController } from './admin-experiences.controller';
import { Experience } from './entities/experience.entity';
import { ExperiencesService } from './experiences.service';

@Module({
  imports: [TypeOrmModule.forFeature([Experience]), AuthModule],
  controllers: [AdminExperiencesController],
  providers: [ExperiencesService],
})
export class ExperiencesModule {}
