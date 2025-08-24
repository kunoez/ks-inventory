import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsNumber, IsBoolean, IsObject } from 'class-validator';
import { ReportType, ReportFormat } from '../../entities/report-activity.entity';

export class CreateReportActivityDto {
  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty()
  @IsString()
  reportName: string;

  @ApiProperty({ enum: ReportFormat })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiProperty()
  @IsString()
  generatedBy: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  generatedByEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  generatedByUserId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  parameters?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  filePath?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  recordCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  success?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyId?: string;
}