import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device, DeviceStatus } from '../entities/device.entity';
import { DeviceAssignment, AssignmentStatus } from '../entities/device-assignment.entity';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { FilterDeviceDto } from './dto/filter-device.dto';
import { BulkUploadDeviceDto } from './dto/bulk-upload-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(DeviceAssignment)
    private deviceAssignmentRepository: Repository<DeviceAssignment>,
  ) {}

  async create(createDeviceDto: CreateDeviceDto): Promise<Device> {
    // Check if serial number already exists
    const existingDevice = await this.deviceRepository.findOne({
      where: {
        serialNumber: createDeviceDto.serialNumber,
        companyId: createDeviceDto.companyId,
      },
    });

    if (existingDevice) {
      throw new ConflictException('Device with this serial number already exists');
    }

    const device = this.deviceRepository.create(createDeviceDto);
    return await this.deviceRepository.save(device);
  }

  async findAll(filters: FilterDeviceDto): Promise<Device[]> {
    const query = this.deviceRepository.createQueryBuilder('device');

    query.where('device.deletedAt IS NULL');

    if (filters.companyId) {
      query.andWhere('device.companyId = :companyId', {
        companyId: filters.companyId,
      });
    }

    if (filters.search) {
      query.andWhere(
        '(device.name LIKE :search OR device.brand LIKE :search OR device.model LIKE :search OR device.serialNumber LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.type && filters.type.length > 0) {
      query.andWhere('device.type IN (:...types)', {
        types: filters.type,
      });
    }

    if (filters.status && filters.status.length > 0) {
      query.andWhere('device.status IN (:...statuses)', {
        statuses: filters.status,
      });
    }

    if (filters.condition && filters.condition.length > 0) {
      query.andWhere('device.condition IN (:...conditions)', {
        conditions: filters.condition,
      });
    }

    if (filters.assignedTo) {
      query
        .leftJoin('device.assignments', 'assignment')
        .andWhere('assignment.employeeId = :employeeId', {
          employeeId: filters.assignedTo,
        })
        .andWhere('assignment.status = :assignmentStatus', {
          assignmentStatus: AssignmentStatus.ACTIVE,
        });
    }

    query.orderBy('device.name', 'ASC');

    return await query.getMany();
  }

  async findOne(id: string): Promise<Device> {
    const device = await this.deviceRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['company', 'assignments', 'assignments.employee'],
    });

    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }

    return device;
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto): Promise<Device> {
    const device = await this.findOne(id);

    Object.assign(device, updateDeviceDto);
    return await this.deviceRepository.save(device);
  }

  async remove(id: string): Promise<void> {
    const device = await this.findOne(id);

    // Check if device is currently assigned
    const activeAssignment = await this.deviceAssignmentRepository.findOne({
      where: { deviceId: id, status: AssignmentStatus.ACTIVE },
    });

    if (activeAssignment) {
      throw new BadRequestException(
        'Cannot delete device that is currently assigned',
      );
    }

    // Soft delete
    device.deletedAt = new Date();
    await this.deviceRepository.save(device);
  }

  async bulkUpload(
    bulkUploadDto: BulkUploadDeviceDto,
  ): Promise<{ success: Device[]; failed: any[] }> {
    const success: Device[] = [];
    const failed: any[] = [];

    for (const deviceDto of bulkUploadDto.devices) {
      try {
        const device = await this.create(deviceDto);
        success.push(device);
      } catch (error) {
        failed.push({
          data: deviceDto,
          error: error.message,
        });
      }
    }

    return { success, failed };
  }

  async getHistory(id: string): Promise<DeviceAssignment[]> {
    const device = await this.findOne(id);

    const assignments = await this.deviceAssignmentRepository.find({
      where: { deviceId: id },
      relations: ['employee'],
      order: { createdAt: 'DESC' },
    });

    return assignments;
  }

  async getAvailableDevices(companyId: string, type?: string): Promise<Device[]> {
    const query = this.deviceRepository.createQueryBuilder('device');

    query
      .where('device.companyId = :companyId', { companyId })
      .andWhere('device.status = :status', { status: DeviceStatus.AVAILABLE })
      .andWhere('device.deletedAt IS NULL');

    if (type) {
      query.andWhere('device.type = :type', { type });
    }

    return await query.getMany();
  }

  async updateStatus(id: string, status: DeviceStatus): Promise<Device> {
    const device = await this.findOne(id);
    device.status = status;
    return await this.deviceRepository.save(device);
  }

  async getStatsByCompany(companyId: string): Promise<any> {
    const stats = await this.deviceRepository
      .createQueryBuilder('device')
      .where('device.companyId = :companyId', { companyId })
      .andWhere('device.deletedAt IS NULL')
      .select('device.type', 'type')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN device.status = :available THEN 1 ELSE 0 END)', 'available')
      .addSelect('SUM(CASE WHEN device.status = :assigned THEN 1 ELSE 0 END)', 'assigned')
      .addSelect('SUM(CASE WHEN device.status = :maintenance THEN 1 ELSE 0 END)', 'maintenance')
      .addSelect('AVG(device.cost)', 'averageCost')
      .addSelect('SUM(device.cost)', 'totalValue')
      .setParameters({
        available: DeviceStatus.AVAILABLE,
        assigned: DeviceStatus.ASSIGNED,
        maintenance: DeviceStatus.MAINTENANCE,
      })
      .groupBy('device.type')
      .getRawMany();

    return stats;
  }
}