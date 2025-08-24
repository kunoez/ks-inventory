import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString, IsNumber, IsObject } from 'class-validator';

export class UserSettingsDto {
  // Notification Settings
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  deviceAlerts?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  licenseExpiry?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  assignmentUpdates?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  systemMaintenance?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  weeklyReports?: boolean;

  // Preferences
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dateFormat?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  itemsPerPage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  defaultView?: string;

  // Security Settings
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sessionTimeout?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  passwordExpiry?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  loginNotifications?: boolean;

  // Azure SSO Settings
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  azureSSOEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  azureTenantId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  azureClientId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  azureAutoProvisioning?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  azureRequireForAllUsers?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  azureSyncGroups?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  azureGroupMapping?: Record<string, string>;

  // Any additional settings can be added here
  [key: string]: any;
}