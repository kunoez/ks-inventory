import {
  IsString,
  IsEnum,
  IsDateString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsPositive,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LicenseType, LicenseStatus } from '../../entities/license.entity';

export class CreateLicenseDto {
  @ApiProperty({ example: 'company-uuid' })
  @IsUUID()
  companyId: string;

  @ApiProperty({ example: 'Microsoft Office 365' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ enum: LicenseType })
  @IsEnum(LicenseType)
  type: LicenseType;

  @ApiProperty({ example: 'Microsoft' })
  @IsString()
  @MaxLength(100)
  vendor: string;

  @ApiProperty({ example: '2021', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  version?: string;

  @ApiProperty({ example: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  licenseKey?: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  purchaseDate: string;

  @ApiProperty({ example: '2025-01-15', required: false })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiProperty({ example: 1200.50 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  cost: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsPositive()
  maxUsers: number;

  @ApiProperty({ enum: LicenseStatus, default: LicenseStatus.ACTIVE })
  @IsEnum(LicenseStatus)
  status: LicenseStatus;

  @ApiProperty({ example: 'Additional notes about the license', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}