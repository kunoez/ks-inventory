import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class FetchUsersDto {
  @ApiProperty({ 
    description: 'Azure AD Tenant ID (uses environment variable if not provided)',
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    required: false
  })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiProperty({ 
    description: 'Azure AD Application (Client) ID (uses environment variable if not provided)',
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    required: false
  })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiProperty({ 
    description: 'Azure AD Client Secret (uses environment variable if not provided)',
    required: false
  })
  @IsString()
  @IsOptional()
  clientSecret?: string;
}