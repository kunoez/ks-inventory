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
import { PhoneContractsService } from './phone-contracts.service';
import { CreatePhoneContractDto } from './dto/create-phone-contract.dto';
import { UpdatePhoneContractDto } from './dto/update-phone-contract.dto';
import { FilterPhoneContractDto } from './dto/filter-phone-contract.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Phone Contracts')
@Controller('phone-contracts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PhoneContractsController {
  constructor(private readonly phoneContractsService: PhoneContractsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new phone contract' })
  @ApiResponse({ status: 201, description: 'Phone contract created successfully' })
  @ApiResponse({ status: 409, description: 'Phone number already exists' })
  create(@Body() createPhoneContractDto: CreatePhoneContractDto) {
    return this.phoneContractsService.create(createPhoneContractDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all phone contracts with filters' })
  @ApiResponse({ status: 200, description: 'List of phone contracts' })
  findAll(@Query() filters: FilterPhoneContractDto) {
    return this.phoneContractsService.findAll(filters);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available phone contracts (not assigned)' })
  @ApiResponse({ status: 200, description: 'List of available phone contracts' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
  getAvailableContracts(@Query('companyId') companyId?: string) {
    return this.phoneContractsService.getAvailableContracts(companyId);
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get phone contracts expiring soon' })
  @ApiResponse({ status: 200, description: 'List of expiring phone contracts' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to look ahead (default: 30)' })
  getExpiringContracts(@Query('days') days: string = '30') {
    return this.phoneContractsService.getExpiringContracts(parseInt(days));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get phone contract by ID' })
  @ApiResponse({ status: 200, description: 'Phone contract details' })
  @ApiResponse({ status: 404, description: 'Phone contract not found' })
  findOne(@Param('id') id: string) {
    return this.phoneContractsService.findOne(id);
  }

  @Get(':id/assignments')
  @ApiOperation({ summary: 'Get phone contract assignments' })
  @ApiResponse({ status: 200, description: 'Phone contract assignments' })
  @ApiResponse({ status: 404, description: 'Phone contract not found' })
  getAssignments(@Param('id') id: string) {
    return this.phoneContractsService.getAssignments(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update phone contract' })
  @ApiResponse({ status: 200, description: 'Phone contract updated successfully' })
  @ApiResponse({ status: 404, description: 'Phone contract not found' })
  update(@Param('id') id: string, @Body() updatePhoneContractDto: UpdatePhoneContractDto) {
    return this.phoneContractsService.update(id, updatePhoneContractDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete phone contract (soft delete)' })
  @ApiResponse({ status: 200, description: 'Phone contract deleted successfully' })
  @ApiResponse({ status: 404, description: 'Phone contract not found' })
  @ApiResponse({ status: 409, description: 'Phone contract has active assignments' })
  remove(@Param('id') id: string) {
    return this.phoneContractsService.remove(id);
  }
}