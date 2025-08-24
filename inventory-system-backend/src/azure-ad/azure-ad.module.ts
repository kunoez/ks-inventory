import { Module } from '@nestjs/common';
import { AzureAdController } from './azure-ad.controller';
import { AzureAdService } from './azure-ad.service';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [EmployeesModule],
  controllers: [AzureAdController],
  providers: [AzureAdService],
  exports: [AzureAdService],
})
export class AzureAdModule {}