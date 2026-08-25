import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Technology } from './entities/technology.entity';
import { TechnologiesController } from './technologies.controller';
import { TechnologiesRepository } from './technologies.repository';
import { TechnologiesService } from './technologies.service';

@Module({
  imports: [TypeOrmModule.forFeature([Technology])],
  controllers: [TechnologiesController],
  providers: [TechnologiesRepository, TechnologiesService],
})
export class TechnologiesModule {}
