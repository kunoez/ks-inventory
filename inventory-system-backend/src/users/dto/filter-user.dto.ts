import { IsOptional, IsString, IsEnum, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, AuthMethod } from '../../entities/user.entity';

export class FilterUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ enum: UserRole, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];

  @ApiProperty({ enum: AuthMethod, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(AuthMethod, { each: true })
  authMethods?: AuthMethod[];
}