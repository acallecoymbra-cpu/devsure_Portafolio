import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdminWorkStyleItemsController } from './admin-work-style-items.controller';
import { WorkStyleItem } from './entities/work-style-item.entity';
import { WorkStyleItemsService } from './work-style-items.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkStyleItem]), AuthModule],
  controllers: [AdminWorkStyleItemsController],
  providers: [WorkStyleItemsService],
})
export class WorkStyleItemsModule {}
