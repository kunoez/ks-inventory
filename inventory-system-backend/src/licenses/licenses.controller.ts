import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { CreateLicenseDto } from './dto/create-license.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { FilterLicenseDto } from './dto/filter-license.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Licenses')
@Controller('licenses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new license' })
  @ApiResponse({ status: 201, description: 'License created successfully' })
  create(@Body() createLicenseDto: CreateLicenseDto) {
    return this.licensesService.create(createLicenseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all licenses with filters' })
  @ApiResponse({ status: 200, description: 'List of licenses' })
  findAll(@Query() filters: FilterLicenseDto) {
    return this.licensesService.findAll(filters);
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get licenses expiring soon' })
  @ApiResponse({ status: 200, description: 'List of expiring licenses' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to look ahead (default: 30)' })
  getExpiringLicenses(@Query('days') days: string = '30') {
    return this.licensesService.getExpiringLicenses(parseInt(days));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get license by ID' })
  @ApiResponse({ status: 200, description: 'License details' })
  @ApiResponse({ status: 404, description: 'License not found' })
  findOne(@Param('id') id: string) {
    return this.licensesService.findOne(id);
  }

  @Get(':id/assignments')
  @ApiOperation({ summary: 'Get license assignments' })
  @ApiResponse({ status: 200, description: 'License assignments' })
  @ApiResponse({ status: 404, description: 'License not found' })
  getAssignments(@Param('id') id: string) {
    return this.licensesService.getAssignments(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update license' })
  @ApiResponse({ status: 200, description: 'License updated successfully' })
  @ApiResponse({ status: 404, description: 'License not found' })
  update(@Param('id') id: string, @Body() updateLicenseDto: UpdateLicenseDto) {
    return this.licensesService.update(id, updateLicenseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete license (soft delete)' })
  @ApiResponse({ status: 200, description: 'License deleted successfully' })
  @ApiResponse({ status: 404, description: 'License not found' })
  @ApiResponse({ status: 409, description: 'License has active assignments' })
  remove(@Param('id') id: string) {
    return this.licensesService.remove(id);
  }
}