import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdminTestimonialsController } from './admin-testimonials.controller';
import { Testimonial } from './entities/testimonial.entity';
import { TestimonialsService } from './testimonials.service';

@Module({
  imports: [TypeOrmModule.forFeature([Testimonial]), AuthModule],
  controllers: [AdminTestimonialsController],
  providers: [TestimonialsService],
})
export class TestimonialsModule {}
