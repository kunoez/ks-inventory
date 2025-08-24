import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { AssignDeviceDto } from './dto/assign-device.dto';
import { AssignLicenseDto } from './dto/assign-license.dto';
import { AssignPhoneDto } from './dto/assign-phone.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Assignments')
@Controller('assignments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post('device')
  @ApiOperation({ summary: 'Assign device to employee' })
  @ApiResponse({ status: 201, description: 'Device assigned successfully' })
  @ApiResponse({ status: 404, description: 'Device or employee not found' })
  @ApiResponse({ status: 409, description: 'Device not available' })
  assignDevice(@Body() assignDeviceDto: AssignDeviceDto) {
    return this.assignmentsService.assignDevice(assignDeviceDto);
  }

  @Post('license')
  @ApiOperation({ summary: 'Assign license to employee' })
  @ApiResponse({ status: 201, description: 'License assigned successfully' })
  @ApiResponse({ status: 404, description: 'License or employee not found' })
  @ApiResponse({ status: 409, description: 'No available license seats' })
  assignLicense(@Body() assignLicenseDto: AssignLicenseDto) {
    return this.assignmentsService.assignLicense(assignLicenseDto);
  }

  @Post('phone')
  @ApiOperation({ summary: 'Assign phone contract to employee' })
  @ApiResponse({ status: 201, description: 'Phone contract assigned successfully' })
  @ApiResponse({ status: 404, description: 'Contract or employee not found' })
  @ApiResponse({ status: 409, description: 'Contract not available' })
  assignPhoneContract(@Body() assignPhoneDto: AssignPhoneDto) {
    return this.assignmentsService.assignPhoneContract(assignPhoneDto);
  }

  @Put('device/:id/return')
  @ApiOperation({ summary: 'Return device' })
  @ApiResponse({ status: 200, description: 'Device returned successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 400, description: 'Assignment not active' })
  returnDevice(@Param('id') id: string) {
    return this.assignmentsService.returnDevice(id);
  }

  @Post('device/unassign')
  @ApiOperation({ summary: 'Unassign device by device ID' })
  @ApiResponse({ status: 200, description: 'Device unassigned successfully' })
  @ApiResponse({ status: 404, description: 'Active assignment not found' })
  unassignDevice(@Body() body: { deviceId: string; returnedBy: string; notes?: string }) {
    return this.assignmentsService.unassignDeviceByDeviceId(body.deviceId, body.returnedBy, body.notes);
  }

  @Put('license/:id/revoke')
  @ApiOperation({ summary: 'Revoke license' })
  @ApiResponse({ status: 200, description: 'License revoked successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 400, description: 'Assignment not active' })
  revokeLicense(@Param('id') id: string) {
    return this.assignmentsService.revokeLicense(id);
  }

  @Post('license/unassign')
  @ApiOperation({ summary: 'Unassign license by license ID' })
  @ApiResponse({ status: 200, description: 'License unassigned successfully' })
  @ApiResponse({ status: 404, description: 'Active assignment not found' })
  unassignLicense(@Body() body: { licenseId: string; returnedBy: string }) {
    return this.assignmentsService.unassignLicenseByLicenseId(body.licenseId, body.returnedBy);
  }

  @Put('phone/:id/return')
  @ApiOperation({ summary: 'Return phone contract' })
  @ApiResponse({ status: 200, description: 'Phone contract returned successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 400, description: 'Assignment not active' })
  returnPhoneContract(@Param('id') id: string) {
    return this.assignmentsService.returnPhoneContract(id);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent assignment activity' })
  @ApiResponse({ status: 200, description: 'Recent activity list' })
  getRecentActivity(@Query('companyId') companyId?: string) {
    return this.assignmentsService.getRecentActivity(companyId);
  }

  @Get('devices')
  @ApiOperation({ summary: 'Get all device assignments' })
  @ApiResponse({ status: 200, description: 'List of device assignments' })
  getDeviceAssignments(@Query('companyId') companyId?: string) {
    return this.assignmentsService.getDeviceAssignments(companyId);
  }

  @Get('licenses')
  @ApiOperation({ summary: 'Get all license assignments' })
  @ApiResponse({ status: 200, description: 'List of license assignments' })
  getLicenseAssignments(@Query('companyId') companyId?: string) {
    return this.assignmentsService.getLicenseAssignments(companyId);
  }

  @Get('phones')
  @ApiOperation({ summary: 'Get all phone assignments' })
  @ApiResponse({ status: 200, description: 'List of phone assignments' })
  getPhoneAssignments(@Query('companyId') companyId?: string) {
    return this.assignmentsService.getPhoneAssignments(companyId);
  }
}