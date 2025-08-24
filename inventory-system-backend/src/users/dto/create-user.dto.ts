import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, AuthMethod } from '../../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@company.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ enum: UserRole, default: UserRole.USER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: 'IT', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiProperty({ example: 'azure-user-id', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  azureId?: string;

  @ApiProperty({ enum: AuthMethod, default: AuthMethod.LOCAL })
  @IsEnum(AuthMethod)
  authMethod: AuthMethod;

  @ApiProperty({ example: true, default: true })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ example: 'password123', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  password?: string; // Only for local auth
}