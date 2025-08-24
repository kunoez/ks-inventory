import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { Device } from '../entities/device.entity';
import { DeviceAssignment } from '../entities/device-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Device, DeviceAssignment])],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
