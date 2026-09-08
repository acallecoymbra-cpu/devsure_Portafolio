import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdminClientLogosController } from './admin-client-logos.controller';
import { ClientLogo } from './entities/client-logo.entity';
import { ClientLogosService } from './client-logos.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClientLogo]), AuthModule],
  controllers: [AdminClientLogosController],
  providers: [ClientLogosService],
  exports: [ClientLogosService],
})
export class ClientLogosModule {}
