import { IsOptional, IsString, IsEnum, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ContractStatus } from '../../entities/phone-contract.entity';

export class FilterPhoneContractDto {
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
  carrier?: string;

  @ApiProperty({ enum: ContractStatus, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(ContractStatus, { each: true })
  statuses?: ContractStatus[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  expiringBefore?: string; // ISO date string
}