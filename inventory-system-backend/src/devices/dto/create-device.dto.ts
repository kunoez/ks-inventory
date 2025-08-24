import {
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DeviceType,
  DeviceStatus,
  DeviceCondition,
} from '../../entities/device.entity';

export class CreateDeviceDto {
  @ApiProperty({ example: 'company-uuid' })
  @IsUUID()
  companyId: string;

  @ApiProperty({ example: 'MacBook Pro 16"' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ enum: DeviceType, example: DeviceType.LAPTOP })
  @IsEnum(DeviceType)
  type: DeviceType;

  @ApiProperty({ example: 'Apple' })
  @IsString()
  @MaxLength(100)
  brand: string;

  @ApiProperty({ example: 'MacBook Pro M2' })
  @IsString()
  @MaxLength(100)
  model: string;

  @ApiProperty({ example: 'SN123456789' })
  @IsString()
  @MaxLength(100)
  serialNumber: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  purchaseDate: string;

  @ApiPropertyOptional({ example: '2027-01-15' })
  @IsOptional()
  @IsDateString()
  warrantyExpiry?: string;

  @ApiProperty({ example: 2499.99 })
  @IsNumber()
  @Min(0)
  cost: number;

  @ApiProperty({ enum: DeviceStatus, default: DeviceStatus.AVAILABLE })
  @IsEnum(DeviceStatus)
  status: DeviceStatus;

  @ApiProperty({ enum: DeviceCondition, default: DeviceCondition.GOOD })
  @IsEnum(DeviceCondition)
  condition: DeviceCondition;

  @ApiPropertyOptional({ example: 'Office A - Shelf 3' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ example: 'Includes charger and original box' })
  @IsOptional()
  @IsString()
  notes?: string;
}