import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdminFaqsController } from './admin-faqs.controller';
import { Faq } from './entities/faq.entity';
import { FaqsService } from './faqs.service';

@Module({
  imports: [TypeOrmModule.forFeature([Faq]), AuthModule],
  controllers: [AdminFaqsController],
  providers: [FaqsService],
})
export class FaqsModule {}
