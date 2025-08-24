import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportActivityService } from './report-activity.service';
import { CreateReportActivityDto } from './dto/create-report-activity.dto';
import { ReportActivity, ReportType } from '../entities/report-activity.entity';

@ApiTags('Report Activity')
@Controller('report-activity')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportActivityController {
  constructor(private readonly reportActivityService: ReportActivityService) {}

  @Get('recent')
  @ApiOperation({ summary: 'Get recent report activities' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Recent report activities retrieved successfully',
  })
  async getRecent(
    @Query('companyId') companyId?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<ReportActivity[]> {
    return this.reportActivityService.findRecent(companyId, limit || 10);
  }

  @Get('by-user')
  @ApiOperation({ summary: 'Get report activities by user' })
  @ApiQuery({ name: 'userId', required: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'User report activities retrieved successfully',
  })
  async getByUser(
    @Query('userId') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<ReportActivity[]> {
    return this.reportActivityService.findByUser(userId, limit || 10);
  }

  @Get('by-type')
  @ApiOperation({ summary: 'Get report activities by type' })
  @ApiQuery({ name: 'type', enum: ReportType })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Report activities by type retrieved successfully',
  })
  async getByType(
    @Query('type') type: ReportType,
    @Query('companyId') companyId?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<ReportActivity[]> {
    return this.reportActivityService.findByType(type, companyId, limit || 10);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get report activity statistics' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiResponse({
    status: 200,
    description: 'Report statistics retrieved successfully',
  })
  async getStatistics(@Query('companyId') companyId?: string) {
    return this.reportActivityService.getStatistics(companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Log a report activity' })
  @ApiResponse({
    status: 201,
    description: 'Report activity logged successfully',
    type: ReportActivity,
  })
  async create(
    @Body() createReportActivityDto: CreateReportActivityDto,
    @Req() req: any,
  ): Promise<ReportActivity> {
    // Add user information from JWT token if available
    if (req.user) {
      createReportActivityDto.generatedByUserId = req.user.id;
      createReportActivityDto.generatedByEmail = req.user.email;
      if (!createReportActivityDto.generatedBy) {
        createReportActivityDto.generatedBy = req.user.name || req.user.email;
      }
    }

    return this.reportActivityService.create(createReportActivityDto);
  }
}