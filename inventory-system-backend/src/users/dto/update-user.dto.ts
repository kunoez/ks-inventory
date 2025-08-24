import { PartialType, OmitType, ApiProperty } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsArray, IsString, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserSettingsDto } from './user-settings.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'password'] as const),
) {
  @ApiProperty({ 
    example: ['company-id-1', 'company-id-2'], 
    required: false,
    description: 'Array of selected company IDs for this user'
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedCompanyIds?: string[];

  @ApiProperty({ 
    type: UserSettingsDto,
    required: false,
    description: 'User preferences and settings'
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UserSettingsDto)
  userSettings?: UserSettingsDto;
}