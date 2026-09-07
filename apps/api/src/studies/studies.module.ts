import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdminStudiesController } from './admin-studies.controller';
import { Study } from './entities/study.entity';
import { StudiesService } from './studies.service';

@Module({
  imports: [TypeOrmModule.forFeature([Study]), AuthModule],
  controllers: [AdminStudiesController],
  providers: [StudiesService],
})
export class StudiesModule {}
