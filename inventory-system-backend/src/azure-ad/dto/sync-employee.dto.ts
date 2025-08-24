import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class SyncEmployeeDto {
  @ApiProperty({ description: 'Company ID to assign the employee to' })
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Azure AD user ID' })
  @IsString()
  @IsNotEmpty()
  azureUserId: string;

  @ApiProperty({ description: 'First name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'Email address' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Department' })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({ description: 'Position/Job title' })
  @IsString()
  @IsNotEmpty()
  position: string;

  @ApiProperty({ description: 'Employee ID (usually UPN)' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ description: 'Office location', required: false })
  @IsString()
  @IsOptional()
  officeLocation?: string;

  @ApiProperty({ description: 'Mobile phone', required: false })
  @IsString()
  @IsOptional()
  mobilePhone?: string;
}