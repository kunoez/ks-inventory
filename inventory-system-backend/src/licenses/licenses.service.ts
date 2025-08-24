import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { License } from '../entities/license.entity';
import { LicenseAssignment } from '../entities/license-assignment.entity';
import { AssignmentStatus } from '../entities/device-assignment.entity';
import { CreateLicenseDto } from './dto/create-license.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { FilterLicenseDto } from './dto/filter-license.dto';
import { NotificationService } from '../notifications/notification.service';
import { NotificationCategory, NotificationType } from '../entities/notification.entity';

@Injectable()
export class LicensesService {
  constructor(
    @InjectRepository(License)
    private licenseRepository: Repository<License>,
    @InjectRepository(LicenseAssignment)
    private licenseAssignmentRepository: Repository<LicenseAssignment>,
    private notificationService: NotificationService,
  ) {}

  async create(createLicenseDto: CreateLicenseDto): Promise<License> {
    const license = this.licenseRepository.create({
      ...createLicenseDto,
      purchaseDate: new Date(createLicenseDto.purchaseDate),
      expiryDate: createLicenseDto.expiryDate ? new Date(createLicenseDto.expiryDate) : null,
      currentUsers: 0,
    });

    const savedLicense = await this.licenseRepository.save(license);

    // Create company-wide notification for new license
    await this.notificationService.createCompanyWideNotification(
      savedLicense.companyId,
      'New License Added',
      `License "${savedLicense.name}" has been added to the inventory`,
      NotificationType.INFO,
      NotificationCategory.LICENSE,
      savedLicense.id,
      'license',
    ).catch(err => console.error('Failed to create notification:', err));

    // Check if license is expiring soon and create notification
    if (savedLicense.expiryDate) {
      const daysUntilExpiry = Math.ceil(
        (new Date(savedLicense.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        await this.notificationService.createCompanyWideNotification(
          savedLicense.companyId,
          'License Expiring Soon',
          `License "${savedLicense.name}" will expire in ${daysUntilExpiry} days`,
          daysUntilExpiry <= 7 ? NotificationType.ERROR : NotificationType.WARNING,
          NotificationCategory.LICENSE,
          savedLicense.id,
          'license',
        ).catch(err => console.error('Failed to create expiry notification:', err));
      }
    }

    return savedLicense;
  }

  async findAll(filters: FilterLicenseDto): Promise<License[]> {
    const query = this.licenseRepository.createQueryBuilder('license');

    query.where('license.deletedAt IS NULL');

    if (filters.companyId) {
      query.andWhere('license.companyId = :companyId', {
        companyId: filters.companyId,
      });
    }

    if (filters.search) {
      query.andWhere(
        '(license.name LIKE :search OR license.vendor LIKE :search OR license.licenseKey LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.vendor) {
      query.andWhere('license.vendor = :vendor', {
        vendor: filters.vendor,
      });
    }

    if (filters.types && filters.types.length > 0) {
      query.andWhere('license.type IN (:...types)', {
        types: filters.types,
      });
    }

    if (filters.statuses && filters.statuses.length > 0) {
      query.andWhere('license.status IN (:...statuses)', {
        statuses: filters.statuses,
      });
    }

    if (filters.expiringBefore) {
      query.andWhere('license.expiryDate <= :expiringBefore', {
        expiringBefore: new Date(filters.expiringBefore),
      });
    }

    query
      .leftJoinAndSelect('license.company', 'company')
      .leftJoinAndSelect('license.assignments', 'assignments')
      .orderBy('license.name', 'ASC');

    const licenses = await query.getMany();
    
    // Calculate actual currentUsers based on active assignments
    return licenses.map(license => {
      const activeAssignments = license.assignments?.filter(
        assignment => assignment.status === AssignmentStatus.ACTIVE
      ) || [];
      
      return {
        ...license,
        currentUsers: activeAssignments.length,
      };
    });
  }

  async findOne(id: string): Promise<License> {
    const license = await this.licenseRepository.findOne({
      where: { id, deletedAt: null },
      relations: [
        'company',
        'assignments',
        'assignments.employee',
      ],
    });

    if (!license) {
      throw new NotFoundException(`License with ID ${id} not found`);
    }

    // Calculate actual currentUsers based on active assignments
    const activeAssignments = license.assignments?.filter(
      assignment => assignment.status === AssignmentStatus.ACTIVE
    ) || [];
    
    return {
      ...license,
      currentUsers: activeAssignments.length,
    };
  }

  async update(id: string, updateLicenseDto: UpdateLicenseDto): Promise<License> {
    const license = await this.findOne(id);

    if (updateLicenseDto.purchaseDate) {
      updateLicenseDto.purchaseDate = new Date(updateLicenseDto.purchaseDate) as any;
    }

    if (updateLicenseDto.expiryDate) {
      updateLicenseDto.expiryDate = new Date(updateLicenseDto.expiryDate) as any;
    }

    Object.assign(license, updateLicenseDto);
    return await this.licenseRepository.save(license);
  }

  async remove(id: string): Promise<void> {
    const license = await this.findOne(id);
    
    // Check if license has active assignments
    const activeAssignments = await this.licenseAssignmentRepository.count({
      where: { licenseId: id, status: AssignmentStatus.ACTIVE },
    });

    if (activeAssignments > 0) {
      throw new ConflictException(
        'Cannot delete license with active assignments. Please unassign all users first.',
      );
    }

    // Soft delete
    license.deletedAt = new Date();
    await this.licenseRepository.save(license);
  }

  async getAssignments(id: string): Promise<any> {
    const license = await this.findOne(id);

    const activeAssignments = license.assignments
      .filter((a) => a.status === 'active')
      .map((a) => ({
        id: a.id,
        employee: a.employee,
        assignedDate: a.assignedDate,
        assignedBy: a.assignedBy,
      }));

    return {
      license: {
        id: license.id,
        name: license.name,
        vendor: license.vendor,
        maxUsers: license.maxUsers,
        currentUsers: license.currentUsers,
      },
      assignments: activeAssignments,
      availableSlots: license.maxUsers - license.currentUsers,
    };
  }

  async getExpiringLicenses(days: number = 30): Promise<License[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    return await this.licenseRepository.find({
      where: {
        expiryDate: LessThan(cutoffDate),
        deletedAt: null,
      },
      relations: ['company'],
      order: {
        expiryDate: 'ASC',
      },
    });
  }

  async updateCurrentUsers(licenseId: string): Promise<void> {
    const activeAssignments = await this.licenseAssignmentRepository.count({
      where: { licenseId, status: AssignmentStatus.ACTIVE },
    });

    await this.licenseRepository.update(licenseId, {
      currentUsers: activeAssignments,
    });
  }
}