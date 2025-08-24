import { IsOptional, IsEnum, IsString, IsArray, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  DeviceType,
  DeviceStatus,
  DeviceCondition,
} from '../../entities/device.entity';

export class FilterDeviceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: DeviceType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(DeviceType, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  type?: DeviceType[];

  @ApiPropertyOptional({ enum: DeviceStatus, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(DeviceStatus, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  status?: DeviceStatus[];

  @ApiPropertyOptional({ enum: DeviceCondition, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(DeviceCondition, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  condition?: DeviceCondition[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string;
}