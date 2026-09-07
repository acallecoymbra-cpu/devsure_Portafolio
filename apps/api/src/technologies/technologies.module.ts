import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Technology } from './entities/technology.entity';
import { TechnologiesController } from './technologies.controller';
import { TechnologiesRepository } from './technologies.repository';
import { TechnologiesService } from './technologies.service';
import { AuthModule } from '../auth/auth.module';
import { AdminTechnologiesController } from './admin-technologies.controller';
import { AdminTechnologiesService } from './admin-technologies.service';

@Module({
  imports: [TypeOrmModule.forFeature([Technology]), AuthModule],
  controllers: [TechnologiesController, AdminTechnologiesController],
  providers: [TechnologiesRepository, TechnologiesService, AdminTechnologiesService],
})
export class TechnologiesModule {}
