import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateLicenseDto } from './create-license.dto';

export class UpdateLicenseDto extends PartialType(
  OmitType(CreateLicenseDto, ['companyId'] as const),
) {}