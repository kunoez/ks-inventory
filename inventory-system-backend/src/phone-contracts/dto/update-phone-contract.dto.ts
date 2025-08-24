import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePhoneContractDto } from './create-phone-contract.dto';

export class UpdatePhoneContractDto extends PartialType(
  OmitType(CreatePhoneContractDto, ['companyId', 'phoneNumber'] as const),
) {}