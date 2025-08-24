import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiQuery({ name: 'companyId', required: false })
  async getStats(@Query('companyId') companyId?: string) {
    return this.dashboardService.getStats(companyId);
  }

  @Get('resource-utilization')
  @ApiOperation({ summary: 'Get resource utilization metrics' })
  @ApiQuery({ name: 'companyId', required: false })
  async getResourceUtilization(@Query('companyId') companyId?: string) {
    return this.dashboardService.getResourceUtilization(companyId);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get system alerts and notifications' })
  @ApiQuery({ name: 'companyId', required: false })
  async getAlerts(@Query('companyId') companyId?: string) {
    return this.dashboardService.getAlerts(companyId);
  }

  @Get('available-devices')
  @ApiOperation({ summary: 'Get list of available devices' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAvailableDevices(
    @Query('companyId') companyId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.dashboardService.getAvailableDevices(companyId, limit);
  }

  @Get('available-licenses')
  @ApiOperation({ summary: 'Get list of available licenses' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAvailableLicenses(
    @Query('companyId') companyId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.dashboardService.getAvailableLicenses(companyId, limit);
  }
}