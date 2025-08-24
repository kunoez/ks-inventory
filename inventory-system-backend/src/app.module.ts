import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import configuration from './config/configuration';

// Import all entities
import { Company } from './entities/company.entity';
import { Employee } from './entities/employee.entity';
import { Device } from './entities/device.entity';
import { License } from './entities/license.entity';
import { PhoneContract } from './entities/phone-contract.entity';
import { DeviceAssignment } from './entities/device-assignment.entity';
import { LicenseAssignment } from './entities/license-assignment.entity';
import { PhoneAssignment } from './entities/phone-assignment.entity';
import { User } from './entities/user.entity';
import { ReportActivity } from './entities/report-activity.entity';
import { Notification } from './entities/notification.entity';
import { CompaniesModule } from './companies/companies.module';
import { EmployeesModule } from './employees/employees.module';
import { DevicesModule } from './devices/devices.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { SeedModule } from './seed/seed.module';
import { UsersModule } from './users/users.module';
import { LicensesModule } from './licenses/licenses.module';
import { PhoneContractsModule } from './phone-contracts/phone-contracts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AzureAdModule } from './azure-ad/azure-ad.module';
import { ReportActivityModule } from './report-activity/report-activity.module';
import { NotificationModule } from './notifications/notification.module';
import { ScheduleModule } from '@nestjs/schedule';
import { LicenseExpiryTask } from './tasks/license-expiry.task';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mssql',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [
          Company,
          Employee,
          Device,
          License,
          PhoneContract,
          DeviceAssignment,
          LicenseAssignment,
          PhoneAssignment,
          User,
          ReportActivity,
          Notification,
        ],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
        options: configService.get('database.options'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    CompaniesModule,
    EmployeesModule,
    DevicesModule,
    LicensesModule,
    PhoneContractsModule,
    AssignmentsModule,
    DashboardModule,
    AzureAdModule,
    ReportActivityModule,
    NotificationModule,
    SeedModule,
    TypeOrmModule.forFeature([License]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    LicenseExpiryTask,
  ],
})
export class AppModule {}
