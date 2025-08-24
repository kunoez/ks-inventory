import {
  IsString,
  IsEmail,
  IsEnum,
  IsDateString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmployeeStatus } from '../../entities/employee.entity';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'company-uuid' })
  @IsUUID()
  companyId: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'john.doe@company.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'IT' })
  @IsString()
  @MaxLength(100)
  department: string;

  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  @MaxLength(100)
  position: string;

  @ApiProperty({ example: 'EMP001' })
  @IsString()
  @MaxLength(50)
  employeeId: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ enum: EmployeeStatus, default: EmployeeStatus.ACTIVE })
  @IsEnum(EmployeeStatus)
  status: EmployeeStatus;
}