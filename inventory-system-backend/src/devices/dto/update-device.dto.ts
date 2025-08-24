import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateDeviceDto } from './create-device.dto';

export class UpdateDeviceDto extends PartialType(
  OmitType(CreateDeviceDto, ['companyId', 'serialNumber'] as const),
) {}