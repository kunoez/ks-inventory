import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicensesController } from './licenses.controller';
import { LicensesService } from './licenses.service';
import { License } from '../entities/license.entity';
import { LicenseAssignment } from '../entities/license-assignment.entity';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([License, LicenseAssignment]),
    NotificationModule,
  ],
  controllers: [LicensesController],
  providers: [LicensesService],
  exports: [LicensesService],
})
export class LicensesModule {}