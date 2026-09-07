import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AdminGuard, LoginRateGuard, OriginGuard, SessionGuard } from './auth.guards';
import { AuthService } from './auth.service';
import { AdminSession } from './entities/admin-session.entity';
import { AdminUser } from './entities/admin-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdminUser, AdminSession])],
  controllers: [AuthController],
  providers: [AuthService, OriginGuard, SessionGuard, AdminGuard, LoginRateGuard],
  exports: [AuthService, OriginGuard, SessionGuard, AdminGuard],
})
export class AuthModule {}
