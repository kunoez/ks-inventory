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
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { FilterDeviceDto } from './dto/filter-device.dto';
import { BulkUploadDeviceDto } from './dto/bulk-upload-device.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Devices')
@Controller('devices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new device' })
  @ApiResponse({ status: 201, description: 'Device created successfully' })
  @ApiResponse({ status: 409, description: 'Serial number already exists' })
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.create(createDeviceDto);
  }

  @Post('bulk-upload')
  @ApiOperation({ summary: 'Bulk upload devices' })
  @ApiResponse({ status: 201, description: 'Devices uploaded with results' })
  bulkUpload(@Body() bulkUploadDto: BulkUploadDeviceDto) {
    return this.devicesService.bulkUpload(bulkUploadDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all devices with filters' })
  @ApiResponse({ status: 200, description: 'List of devices' })
  findAll(@Query() filters: FilterDeviceDto) {
    return this.devicesService.findAll(filters);
  }

  @Get('available/:companyId')
  @ApiOperation({ summary: 'Get available devices for a company' })
  @ApiResponse({ status: 200, description: 'List of available devices' })
  getAvailable(
    @Param('companyId') companyId: string,
    @Query('type') type?: string,
  ) {
    return this.devicesService.getAvailableDevices(companyId, type);
  }

  @Get('stats/:companyId')
  @ApiOperation({ summary: 'Get device statistics by company' })
  @ApiResponse({ status: 200, description: 'Device statistics' })
  getStats(@Param('companyId') companyId: string) {
    return this.devicesService.getStatsByCompany(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get device by ID' })
  @ApiResponse({ status: 200, description: 'Device details' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  findOne(@Param('id') id: string) {
    return this.devicesService.findOne(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get device assignment history' })
  @ApiResponse({ status: 200, description: 'Assignment history' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  getHistory(@Param('id') id: string) {
    return this.devicesService.getHistory(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update device' })
  @ApiResponse({ status: 200, description: 'Device updated successfully' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  update(@Param('id') id: string, @Body() updateDeviceDto: UpdateDeviceDto) {
    return this.devicesService.update(id, updateDeviceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete device (soft delete)' })
  @ApiResponse({ status: 200, description: 'Device deleted successfully' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  @ApiResponse({ status: 400, description: 'Device is currently assigned' })
  remove(@Param('id') id: string) {
    return this.devicesService.remove(id);
  }
}