import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Company } from '../entities/company.entity';
import { User } from '../entities/user.entity';
import { Employee } from '../entities/employee.entity';
import { Device } from '../entities/device.entity';
import { License } from '../entities/license.entity';
import { PhoneContract } from '../entities/phone-contract.entity';
import { DeviceAssignment } from '../entities/device-assignment.entity';
import { LicenseAssignment } from '../entities/license-assignment.entity';
import { PhoneAssignment } from '../entities/phone-assignment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      User,
      Employee,
      Device,
      License,
      PhoneContract,
      DeviceAssignment,
      LicenseAssignment,
      PhoneAssignment,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}