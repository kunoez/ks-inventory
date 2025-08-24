import { IsOptional, IsEnum, IsString, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeStatus } from '../../entities/employee.entity';

export class FilterEmployeeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  department?: string[];

  @ApiPropertyOptional({ enum: EmployeeStatus, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(EmployeeStatus, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  status?: EmployeeStatus[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string;
}