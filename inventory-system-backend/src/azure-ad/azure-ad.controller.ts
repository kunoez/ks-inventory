import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AzureAdService } from './azure-ad.service';
import { EmployeesService } from '../employees/employees.service';
import { FetchUsersDto } from './dto/fetch-users.dto';
import { SyncEmployeeDto } from './dto/sync-employee.dto';
import { AzureUserDto } from './dto/azure-user.dto';
import { EmployeeStatus } from '../entities/employee.entity';

@ApiTags('Azure AD')
@Controller('azure-ad')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AzureAdController {
  constructor(
    private readonly azureAdService: AzureAdService,
    private readonly employeesService: EmployeesService,
    private readonly configService: ConfigService,
  ) {}

  @Get('config')
  @ApiOperation({ summary: 'Get Azure AD configuration (without secrets)' })
  @ApiResponse({
    status: 200,
    description: 'Configuration retrieved successfully',
  })
  getAzureConfig() {
    return {
      tenantId: this.configService.get('azure.tenantId'),
      clientId: this.configService.get('azure.clientId'),
      hasSecret: !!this.configService.get('azure.clientSecret'),
      isConfigured: !!this.configService.get('azure.tenantId') && 
                    !!this.configService.get('azure.clientId') && 
                    !!this.configService.get('azure.clientSecret'),
    };
  }

  @Post('fetch-users')
  @ApiOperation({ summary: 'Fetch users from Azure AD' })
  @ApiResponse({
    status: 200,
    description: 'Users fetched successfully',
    type: [AzureUserDto],
  })
  @ApiResponse({ status: 400, description: 'Invalid Azure AD credentials' })
  async fetchUsers(@Body() fetchUsersDto: Partial<FetchUsersDto> = {}): Promise<AzureUserDto[]> {
    // Use environment variables if not provided in request
    const tenantId = fetchUsersDto.tenantId || this.configService.get('azure.tenantId');
    const clientId = fetchUsersDto.clientId || this.configService.get('azure.clientId');
    const clientSecret = fetchUsersDto.clientSecret || this.configService.get('azure.clientSecret');

    if (!tenantId || !clientId || !clientSecret) {
      throw new BadRequestException('Azure AD credentials not configured. Please check environment variables or provide credentials.');
    }

    return this.azureAdService.fetchAzureUsers(
      tenantId,
      clientId,
      clientSecret,
    );
  }

  @Post('sync-employee')
  @ApiOperation({ summary: 'Create employee from Azure AD user' })
  @ApiResponse({
    status: 201,
    description: 'Employee created successfully',
  })
  @ApiResponse({ status: 400, description: 'Employee already exists or invalid data' })
  async syncEmployee(@Body() syncEmployeeDto: SyncEmployeeDto) {
    // Check if employee already exists with this email in the company
    const existingEmployees = await this.employeesService.findAll({
      companyId: syncEmployeeDto.companyId,
      search: syncEmployeeDto.email,
    });

    if (existingEmployees.some(emp => emp.email === syncEmployeeDto.email)) {
      throw new BadRequestException('Employee with this email already exists in the company');
    }

    // Create employee from Azure AD data
    const employeeData = {
      companyId: syncEmployeeDto.companyId,
      firstName: syncEmployeeDto.firstName,
      lastName: syncEmployeeDto.lastName,
      email: syncEmployeeDto.email,
      department: syncEmployeeDto.department,
      position: syncEmployeeDto.position,
      employeeId: syncEmployeeDto.employeeId.split('@')[0], // Use username part of UPN
      startDate: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
      status: EmployeeStatus.ACTIVE,
    };

    return this.employeesService.create(employeeData);
  }

  @Post('validate-credentials')
  @ApiOperation({ summary: 'Validate Azure AD credentials' })
  @ApiResponse({
    status: 200,
    description: 'Credentials are valid',
    schema: { type: 'object', properties: { valid: { type: 'boolean' } } },
  })
  async validateCredentials(@Body() credentials: Partial<FetchUsersDto> = {}) {
    // Use environment variables if not provided in request
    const tenantId = credentials.tenantId || this.configService.get('azure.tenantId');
    const clientId = credentials.clientId || this.configService.get('azure.clientId');
    const clientSecret = credentials.clientSecret || this.configService.get('azure.clientSecret');

    if (!tenantId || !clientId || !clientSecret) {
      return { valid: false, message: 'Azure AD credentials not configured' };
    }

    const valid = await this.azureAdService.validateAzureCredentials(
      tenantId,
      clientId,
      clientSecret,
    );
    return { valid };
  }
}