import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdminCultureTeamController } from './admin-culture-team.controller';
import { CultureTeamMember } from './entities/culture-team-member.entity';
import { CultureTeamService } from './culture-team.service';

@Module({
  imports: [TypeOrmModule.forFeature([CultureTeamMember]), AuthModule],
  controllers: [AdminCultureTeamController],
  providers: [CultureTeamService],
})
export class CultureTeamModule {}
