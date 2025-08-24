import {
  IsString,
  IsEnum,
  IsDateString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsPositive,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ContractStatus } from '../../entities/phone-contract.entity';

export class CreatePhoneContractDto {
  @ApiProperty({ example: 'company-uuid' })
  @IsUUID()
  companyId: string;

  @ApiProperty({ example: '+49 123 456789' })
  @IsString()
  @MaxLength(50)
  phoneNumber: string;

  @ApiProperty({ example: 'Vodafone' })
  @IsString()
  @MaxLength(100)
  carrier: string;

  @ApiProperty({ example: 'Business Unlimited' })
  @IsString()
  @MaxLength(100)
  plan: string;

  @ApiProperty({ example: 49.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  monthlyFee: number;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  contractStartDate: string;

  @ApiProperty({ example: '2026-01-15', required: false })
  @IsOptional()
  @IsDateString()
  contractEndDate?: string;

  @ApiProperty({ example: '1234', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  pin?: string;

  @ApiProperty({ example: '12345678', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  puk?: string;

  @ApiProperty({ enum: ContractStatus, default: ContractStatus.ACTIVE })
  @IsEnum(ContractStatus)
  status: ContractStatus;

  @ApiProperty({ example: '10GB', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  dataLimit?: string;

  @ApiProperty({ example: 'Unlimited', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  minutes?: string;

  @ApiProperty({ example: 'Unlimited', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sms?: string;

  @ApiProperty({ example: 'Business contract with special conditions', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}