import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateDeviceDto } from './create-device.dto';

export class BulkUploadDeviceDto {
  @ApiProperty({ type: [CreateDeviceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDeviceDto)
  devices: CreateDeviceDto[];
}