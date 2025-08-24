import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Device, DeviceStatus, DeviceType } from '../entities/device.entity';
import { License, LicenseStatus } from '../entities/license.entity';
import { PhoneContract, ContractStatus } from '../entities/phone-contract.entity';
import { Employee } from '../entities/employee.entity';
import { DeviceAssignment, AssignmentStatus } from '../entities/device-assignment.entity';
import { LicenseAssignment } from '../entities/license-assignment.entity';
import { PhoneAssignment } from '../entities/phone-assignment.entity';
import { AssignDeviceDto } from './dto/assign-device.dto';
import { AssignLicenseDto } from './dto/assign-license.dto';
import { AssignPhoneDto } from './dto/assign-phone.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(License)
    private licenseRepository: Repository<License>,
    @InjectRepository(PhoneContract)
    private phoneContractRepository: Repository<PhoneContract>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(DeviceAssignment)
    private deviceAssignmentRepository: Repository<DeviceAssignment>,
    @InjectRepository(LicenseAssignment)
    private licenseAssignmentRepository: Repository<LicenseAssignment>,
    @InjectRepository(PhoneAssignment)
    private phoneAssignmentRepository: Repository<PhoneAssignment>,
    private dataSource: DataSource,
  ) {}

  async assignDevice(assignDeviceDto: AssignDeviceDto): Promise<DeviceAssignment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate device exists and is available
      const device = await queryRunner.manager.findOne(Device, {
        where: { id: assignDeviceDto.deviceId },
      });

      if (!device) {
        throw new NotFoundException('Device not found');
      }

      if (device.status !== DeviceStatus.AVAILABLE) {
        throw new ConflictException('Device is not available for assignment');
      }

      // Validate employee exists
      const employee = await queryRunner.manager.findOne(Employee, {
        where: { id: assignDeviceDto.employeeId },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      // Create assignment
      const assignment = queryRunner.manager.create(DeviceAssignment, {
        deviceId: assignDeviceDto.deviceId,
        employeeId: assignDeviceDto.employeeId,
        assignedBy: assignDeviceDto.assignedBy,
        notes: assignDeviceDto.notes,
        assignedDate: new Date(),
        status: AssignmentStatus.ACTIVE,
      });

      await queryRunner.manager.save(assignment);

      // Update device status
      device.status = DeviceStatus.ASSIGNED;
      await queryRunner.manager.save(device);

      // Note: Phone contract assignment should be handled separately
      // through the assignPhoneContract method to allow user selection

      await queryRunner.commitTransaction();
      return assignment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async assignLicense(assignLicenseDto: AssignLicenseDto): Promise<LicenseAssignment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate license exists and has available seats
      const license = await queryRunner.manager.findOne(License, {
        where: { id: assignLicenseDto.licenseId },
      });

      if (!license) {
        throw new NotFoundException('License not found');
      }

      if (license.currentUsers >= license.maxUsers) {
        throw new ConflictException('No available license seats');
      }

      if (license.status !== LicenseStatus.ACTIVE) {
        throw new ConflictException('License is not active');
      }

      // Validate employee exists
      const employee = await queryRunner.manager.findOne(Employee, {
        where: { id: assignLicenseDto.employeeId },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      // Check if employee already has this license
      const existingAssignment = await queryRunner.manager.findOne(LicenseAssignment, {
        where: {
          licenseId: assignLicenseDto.licenseId,
          employeeId: assignLicenseDto.employeeId,
          status: AssignmentStatus.ACTIVE,
        },
      });

      if (existingAssignment) {
        throw new ConflictException('Employee already has this license assigned');
      }

      // Create assignment
      const assignment = queryRunner.manager.create(LicenseAssignment, {
        licenseId: assignLicenseDto.licenseId,
        employeeId: assignLicenseDto.employeeId,
        assignedBy: assignLicenseDto.assignedBy,
        notes: assignLicenseDto.notes,
        assignedDate: new Date(),
        status: AssignmentStatus.ACTIVE,
      });

      await queryRunner.manager.save(assignment);

      // Update license current users
      license.currentUsers += 1;
      await queryRunner.manager.save(license);

      await queryRunner.commitTransaction();
      return assignment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async assignPhoneContract(assignPhoneDto: AssignPhoneDto): Promise<PhoneAssignment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate phone contract exists and is available
      const phoneContract = await queryRunner.manager.findOne(PhoneContract, {
        where: { id: assignPhoneDto.phoneContractId },
      });

      if (!phoneContract) {
        throw new NotFoundException('Phone contract not found');
      }

      if (phoneContract.status !== ContractStatus.ACTIVE) {
        throw new ConflictException('Phone contract is not available for assignment');
      }

      // Validate employee exists
      const employee = await queryRunner.manager.findOne(Employee, {
        where: { id: assignPhoneDto.employeeId },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      // Create assignment
      const assignment = queryRunner.manager.create(PhoneAssignment, {
        phoneContractId: assignPhoneDto.phoneContractId,
        employeeId: assignPhoneDto.employeeId,
        assignedBy: assignPhoneDto.assignedBy,
        notes: assignPhoneDto.notes,
        assignedDate: new Date(),
        status: AssignmentStatus.ACTIVE,
      });

      await queryRunner.manager.save(assignment);

      // Update phone contract status
      phoneContract.status = ContractStatus.ASSIGNED;
      await queryRunner.manager.save(phoneContract);

      await queryRunner.commitTransaction();
      return assignment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async returnDevice(assignmentId: string): Promise<DeviceAssignment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const assignment = await queryRunner.manager.findOne(DeviceAssignment, {
        where: { id: assignmentId },
      });

      if (!assignment) {
        throw new NotFoundException('Assignment not found');
      }

      if (assignment.status !== AssignmentStatus.ACTIVE) {
        throw new BadRequestException('Assignment is not active');
      }

      // Update assignment
      assignment.status = AssignmentStatus.RETURNED;
      assignment.returnDate = new Date();
      await queryRunner.manager.save(assignment);

      // Update device status
      const device = await queryRunner.manager.findOne(Device, {
        where: { id: assignment.deviceId },
      });

      if (device) {
        device.status = DeviceStatus.AVAILABLE;
        await queryRunner.manager.save(device);

        // If device is a phone, also return phone contract
        if (device.type === DeviceType.PHONE) {
          const phoneAssignment = await queryRunner.manager.findOne(PhoneAssignment, {
            where: {
              employeeId: assignment.employeeId,
              status: AssignmentStatus.ACTIVE,
            },
          });

          if (phoneAssignment) {
            phoneAssignment.status = AssignmentStatus.RETURNED;
            phoneAssignment.returnDate = new Date();
            await queryRunner.manager.save(phoneAssignment);

            const phoneContract = await queryRunner.manager.findOne(PhoneContract, {
              where: { id: phoneAssignment.phoneContractId },
            });

            if (phoneContract) {
              phoneContract.status = ContractStatus.ACTIVE;
              await queryRunner.manager.save(phoneContract);
            }
          }
        }
      }

      await queryRunner.commitTransaction();
      return assignment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async revokeLicense(assignmentId: string): Promise<LicenseAssignment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const assignment = await queryRunner.manager.findOne(LicenseAssignment, {
        where: { id: assignmentId },
      });

      if (!assignment) {
        throw new NotFoundException('Assignment not found');
      }

      if (assignment.status !== AssignmentStatus.ACTIVE) {
        throw new BadRequestException('Assignment is not active');
      }

      // Update assignment
      assignment.status = AssignmentStatus.REVOKED;
      assignment.revokedDate = new Date();
      await queryRunner.manager.save(assignment);

      // Update license current users
      const license = await queryRunner.manager.findOne(License, {
        where: { id: assignment.licenseId },
      });

      if (license) {
        license.currentUsers = Math.max(0, license.currentUsers - 1);
        await queryRunner.manager.save(license);
      }

      await queryRunner.commitTransaction();
      return assignment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async returnPhoneContract(assignmentId: string): Promise<PhoneAssignment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const assignment = await queryRunner.manager.findOne(PhoneAssignment, {
        where: { id: assignmentId },
      });

      if (!assignment) {
        throw new NotFoundException('Assignment not found');
      }

      if (assignment.status !== AssignmentStatus.ACTIVE) {
        throw new BadRequestException('Assignment is not active');
      }

      // Update assignment
      assignment.status = AssignmentStatus.RETURNED;
      assignment.returnDate = new Date();
      await queryRunner.manager.save(assignment);

      // Update phone contract status
      const phoneContract = await queryRunner.manager.findOne(PhoneContract, {
        where: { id: assignment.phoneContractId },
      });

      if (phoneContract) {
        phoneContract.status = ContractStatus.ACTIVE;
        await queryRunner.manager.save(phoneContract);
      }

      await queryRunner.commitTransaction();
      return assignment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getRecentActivity(companyId?: string): Promise<any> {
    const activities = [];

    // Get recent device assignments
    const deviceAssignments = await this.deviceAssignmentRepository
      .createQueryBuilder('da')
      .leftJoinAndSelect('da.device', 'device')
      .leftJoinAndSelect('da.employee', 'employee')
      .where(companyId ? 'device.companyId = :companyId' : '1=1', { companyId })
      .orderBy('da.createdAt', 'DESC')
      .limit(15)
      .getMany();

    // Get recent license assignments
    const licenseAssignments = await this.licenseAssignmentRepository
      .createQueryBuilder('la')
      .leftJoinAndSelect('la.license', 'license')
      .leftJoinAndSelect('la.employee', 'employee')
      .where(companyId ? 'license.companyId = :companyId' : '1=1', { companyId })
      .orderBy('la.createdAt', 'DESC')
      .limit(15)
      .getMany();

    // Get recent phone assignments
    const phoneAssignments = await this.phoneAssignmentRepository
      .createQueryBuilder('pa')
      .leftJoinAndSelect('pa.phoneContract', 'phoneContract')
      .leftJoinAndSelect('pa.employee', 'employee')
      .where(companyId ? 'phoneContract.companyId = :companyId' : '1=1', { companyId })
      .orderBy('pa.createdAt', 'DESC')
      .limit(15)
      .getMany();

    // Format device activities
    deviceAssignments.forEach((a) => {
      const isActive = a.status === AssignmentStatus.ACTIVE;
      activities.push({
        id: a.id,
        type: 'device',
        action: isActive ? 'assigned' : a.status === AssignmentStatus.RETURNED ? 'returned' : 'revoked',
        status: a.status.toLowerCase(),
        timestamp: a.createdAt,
        assignedDate: a.assignedDate,
        returnedDate: a.returnDate || undefined,
        employee: a.employee ? {
          id: a.employee.id,
          firstName: a.employee.firstName,
          lastName: a.employee.lastName,
          email: a.employee.email,
          department: a.employee.department,
        } : null,
        item: a.device ? {
          id: a.device.id,
          name: a.device.name,
          type: a.device.type,
          manufacturer: a.device.brand,
          model: a.device.model,
        } : null,
        actionBy: a.assignedBy,
        notes: a.notes,
      });
    });

    // Format license activities
    licenseAssignments.forEach((a) => {
      const isActive = a.status === AssignmentStatus.ACTIVE;
      activities.push({
        id: a.id,
        type: 'license',
        action: isActive ? 'assigned' : a.status === AssignmentStatus.REVOKED ? 'revoked' : 'returned',
        status: a.status.toLowerCase(),
        timestamp: a.createdAt,
        assignedDate: a.assignedDate,
        returnedDate: a.revokedDate || undefined,
        employee: a.employee ? {
          id: a.employee.id,
          firstName: a.employee.firstName,
          lastName: a.employee.lastName,
          email: a.employee.email,
          department: a.employee.department,
        } : null,
        item: a.license ? {
          id: a.license.id,
          name: a.license.name,
          type: 'Software License',
          manufacturer: a.license.vendor,
          model: a.license.version,
        } : null,
        actionBy: a.assignedBy,
        notes: a.notes,
      });
    });

    // Format phone activities
    phoneAssignments.forEach((a) => {
      const isActive = a.status === AssignmentStatus.ACTIVE;
      activities.push({
        id: a.id,
        type: 'phone',
        action: isActive ? 'assigned' : a.status === AssignmentStatus.RETURNED ? 'returned' : 'revoked',
        status: a.status.toLowerCase(),
        timestamp: a.createdAt,
        assignedDate: a.assignedDate,
        returnedDate: a.returnDate || undefined,
        employee: a.employee ? {
          id: a.employee.id,
          firstName: a.employee.firstName,
          lastName: a.employee.lastName,
          email: a.employee.email,
          department: a.employee.department,
        } : null,
        item: a.phoneContract ? {
          id: a.phoneContract.id,
          name: `${a.phoneContract.carrier} - ${a.phoneContract.phoneNumber}`,
          type: 'Phone Contract',
          manufacturer: a.phoneContract.carrier,
          model: a.phoneContract.plan,
        } : null,
        actionBy: a.assignedBy,
        notes: a.notes,
      });
    });

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
      const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    // Return top 20 activities with total count
    return {
      activities: activities.slice(0, 20),
      total: activities.length,
    };
  }

  async unassignDeviceByDeviceId(deviceId: string, returnedBy: string, notes?: string): Promise<DeviceAssignment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find active assignment for this device
      const assignment = await queryRunner.manager.findOne(DeviceAssignment, {
        where: { 
          deviceId: deviceId,
          status: AssignmentStatus.ACTIVE 
        },
      });

      if (!assignment) {
        throw new NotFoundException('No active assignment found for this device');
      }

      // Update assignment - Set returnDate when unassigning
      assignment.status = AssignmentStatus.RETURNED;
      assignment.returnDate = new Date();
      if (notes) {
        assignment.notes = notes;
      }
      await queryRunner.manager.save(assignment);

      // Update device status to available
      const device = await queryRunner.manager.findOne(Device, {
        where: { id: deviceId },
      });

      if (device) {
        device.status = DeviceStatus.AVAILABLE;
        await queryRunner.manager.save(device);

        // If device is a phone, also return phone contract
        if (device.type === DeviceType.PHONE) {
          const phoneAssignment = await queryRunner.manager.findOne(PhoneAssignment, {
            where: {
              employeeId: assignment.employeeId,
              status: AssignmentStatus.ACTIVE,
            },
          });

          if (phoneAssignment) {
            phoneAssignment.status = AssignmentStatus.RETURNED;
            phoneAssignment.returnDate = new Date();
            await queryRunner.manager.save(phoneAssignment);

            const phoneContract = await queryRunner.manager.findOne(PhoneContract, {
              where: { id: phoneAssignment.phoneContractId },
            });

            if (phoneContract) {
              phoneContract.status = ContractStatus.ACTIVE;
              await queryRunner.manager.save(phoneContract);
            }
          }
        }
      }

      await queryRunner.commitTransaction();
      return assignment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async unassignLicenseByLicenseId(licenseId: string, returnedBy: string): Promise<LicenseAssignment[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find all active assignments for this license
      const assignments = await queryRunner.manager.find(LicenseAssignment, {
        where: { 
          licenseId: licenseId,
          status: AssignmentStatus.ACTIVE 
        },
      });

      if (!assignments || assignments.length === 0) {
        throw new NotFoundException('No active assignments found for this license');
      }

      // Update all assignments - Set revokedDate when unassigning
      for (const assignment of assignments) {
        assignment.status = AssignmentStatus.REVOKED;
        assignment.revokedDate = new Date();
        await queryRunner.manager.save(assignment);
      }

      // Update license current users count
      const license = await queryRunner.manager.findOne(License, {
        where: { id: licenseId },
      });

      if (license) {
        // Recalculate based on active assignments
        const activeCount = await queryRunner.manager.count(LicenseAssignment, {
          where: { 
            licenseId: licenseId,
            status: AssignmentStatus.ACTIVE 
          },
        });
        license.currentUsers = activeCount;
        await queryRunner.manager.save(license);
      }

      await queryRunner.commitTransaction();
      return assignments;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getDeviceAssignments(companyId?: string): Promise<DeviceAssignment[]> {
    const query = this.deviceAssignmentRepository
      .createQueryBuilder('da')
      .leftJoinAndSelect('da.device', 'device')
      .leftJoinAndSelect('da.employee', 'employee')
      .orderBy('da.assignedDate', 'DESC');

    if (companyId) {
      query.where('device.companyId = :companyId', { companyId });
    }

    return await query.getMany();
  }

  async getLicenseAssignments(companyId?: string): Promise<LicenseAssignment[]> {
    const query = this.licenseAssignmentRepository
      .createQueryBuilder('la')
      .leftJoinAndSelect('la.license', 'license')
      .leftJoinAndSelect('la.employee', 'employee')
      .orderBy('la.assignedDate', 'DESC');

    if (companyId) {
      query.where('license.companyId = :companyId', { companyId });
    }

    return await query.getMany();
  }

  async getPhoneAssignments(companyId?: string): Promise<PhoneAssignment[]> {
    const query = this.phoneAssignmentRepository
      .createQueryBuilder('pa')
      .leftJoinAndSelect('pa.phoneContract', 'phoneContract')
      .leftJoinAndSelect('pa.employee', 'employee')
      .orderBy('pa.assignedDate', 'DESC');

    if (companyId) {
      query.where('phoneContract.companyId = :companyId', { companyId });
    }

    return await query.getMany();
  }
}