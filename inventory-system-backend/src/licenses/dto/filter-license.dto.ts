import { IsOptional, IsString, IsEnum, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LicenseType, LicenseStatus } from '../../entities/license.entity';

export class FilterLicenseDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiProperty({ enum: LicenseType, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(LicenseType, { each: true })
  types?: LicenseType[];

  @ApiProperty({ enum: LicenseStatus, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(LicenseStatus, { each: true })
  statuses?: LicenseStatus[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  expiringBefore?: string; // ISO date string
}