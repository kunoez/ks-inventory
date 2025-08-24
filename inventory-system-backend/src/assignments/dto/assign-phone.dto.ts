import { IsUUID, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignPhoneDto {
  @ApiProperty({ example: 'phone-contract-uuid' })
  @IsUUID()
  phoneContractId: string;

  @ApiProperty({ example: 'employee-uuid' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ example: 'admin@company.com' })
  @IsString()
  assignedBy: string;

  @ApiPropertyOptional({ example: 'Business phone for sales role' })
  @IsOptional()
  @IsString()
  notes?: string;
}