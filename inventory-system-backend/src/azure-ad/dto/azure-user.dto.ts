import { ApiProperty } from '@nestjs/swagger';

export class AzureManagerDto {
  @ApiProperty({ description: 'Manager Azure AD ID' })
  id: string;

  @ApiProperty({ description: 'Manager display name' })
  displayName: string;

  @ApiProperty({ description: 'Manager email' })
  mail: string;
}

export class AzureUserDto {
  @ApiProperty({ description: 'Azure AD user ID' })
  id: string;

  @ApiProperty({ description: 'Display name' })
  displayName: string;

  @ApiProperty({ description: 'First name' })
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  lastName: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ description: 'User principal name' })
  userPrincipalName: string;

  @ApiProperty({ description: 'Department' })
  department: string;

  @ApiProperty({ description: 'Job title' })
  jobTitle: string;

  @ApiProperty({ description: 'Office location', required: false })
  officeLocation?: string;

  @ApiProperty({ description: 'Mobile phone', required: false })
  mobilePhone?: string;

  @ApiProperty({ description: 'Manager information', required: false, type: AzureManagerDto })
  manager?: AzureManagerDto;
}