import { IsUUID, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignDeviceDto {
  @ApiProperty({ example: 'device-uuid' })
  @IsUUID()
  deviceId: string;

  @ApiProperty({ example: 'employee-uuid' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ example: 'admin@company.com' })
  @IsString()
  assignedBy: string;

  @ApiPropertyOptional({ example: 'Assigned for remote work' })
  @IsOptional()
  @IsString()
  notes?: string;
}