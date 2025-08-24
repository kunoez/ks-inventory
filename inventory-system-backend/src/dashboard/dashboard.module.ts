import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Device } from '../entities/device.entity';
import { License } from '../entities/license.entity';
import { Employee } from '../entities/employee.entity';
import { PhoneContract } from '../entities/phone-contract.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, License, Employee, PhoneContract]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}