import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { Device } from '../entities/device.entity';
import { License } from '../entities/license.entity';
import { PhoneContract } from '../entities/phone-contract.entity';
import { Employee } from '../entities/employee.entity';
import { DeviceAssignment } from '../entities/device-assignment.entity';
import { LicenseAssignment } from '../entities/license-assignment.entity';
import { PhoneAssignment } from '../entities/phone-assignment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Device,
      License,
      PhoneContract,
      Employee,
      DeviceAssignment,
      LicenseAssignment,
      PhoneAssignment,
    ]),
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
