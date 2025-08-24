import { IsUUID, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignLicenseDto {
  @ApiProperty({ example: 'license-uuid' })
  @IsUUID()
  licenseId: string;

  @ApiProperty({ example: 'employee-uuid' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ example: 'admin@company.com' })
  @IsString()
  assignedBy: string;

  @ApiPropertyOptional({ example: 'Required for development work' })
  @IsOptional()
  @IsString()
  notes?: string;
}