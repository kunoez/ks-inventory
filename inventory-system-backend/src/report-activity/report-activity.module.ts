import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportActivity } from '../entities/report-activity.entity';
import { ReportActivityService } from './report-activity.service';
import { ReportActivityController } from './report-activity.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ReportActivity])],
  providers: [ReportActivityService],
  controllers: [ReportActivityController],
  exports: [ReportActivityService],
})
export class ReportActivityModule {}