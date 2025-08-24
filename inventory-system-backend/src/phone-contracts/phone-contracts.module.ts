import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhoneContractsController } from './phone-contracts.controller';
import { PhoneContractsService } from './phone-contracts.service';
import { PhoneContract } from '../entities/phone-contract.entity';
import { PhoneAssignment } from '../entities/phone-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PhoneContract, PhoneAssignment])],
  controllers: [PhoneContractsController],
  providers: [PhoneContractsService],
  exports: [PhoneContractsService],
})
export class PhoneContractsModule {}