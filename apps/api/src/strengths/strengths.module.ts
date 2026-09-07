import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdminStrengthsController } from './admin-strengths.controller';
import { Strength } from './entities/strength.entity';
import { StrengthsService } from './strengths.service';

@Module({
  imports: [TypeOrmModule.forFeature([Strength]), AuthModule],
  controllers: [AdminStrengthsController],
  providers: [StrengthsService],
})
export class StrengthsModule {}
