import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdminCulturePillarsController } from './admin-culture-pillars.controller';
import { CulturePillar } from './entities/culture-pillar.entity';
import { CulturePillarsService } from './culture-pillars.service';

@Module({
  imports: [TypeOrmModule.forFeature([CulturePillar]), AuthModule],
  controllers: [AdminCulturePillarsController],
  providers: [CulturePillarsService],
})
export class CulturePillarsModule {}
