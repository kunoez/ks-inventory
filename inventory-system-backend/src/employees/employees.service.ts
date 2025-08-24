import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Employee } from '../entities/employee.entity';
import { AssignmentStatus } from '../entities/device-assignment.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { FilterEmployeeDto } from './dto/filter-employee.dto';
import { NotificationService } from '../notifications/notification.service';
import { NotificationCategory, NotificationType } from '../entities/notification.entity';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private notificationService: NotificationService,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    // Check if employee ID or email already exists in the company
    const existingEmployee = await this.employeeRepository.findOne({
      where: [
        {
          employeeId: createEmployeeDto.employeeId,
          companyId: createEmployeeDto.companyId,
        },
        {
          email: createEmployeeDto.email,
          companyId: createEmployeeDto.companyId,
        },
      ],
    });

    if (existingEmployee) {
      throw new ConflictException(
        'Employee ID or email already exists in this company',
      );
    }

    const employee = this.employeeRepository.create(createEmployeeDto);
    const savedEmployee = await this.employeeRepository.save(employee);

    // Create company-wide notification for new employee
    await this.notificationService.createCompanyWideNotification(
      savedEmployee.companyId,
      'New Employee Added',
      `${savedEmployee.firstName} ${savedEmployee.lastName} has joined the ${savedEmployee.department} department`,
      NotificationType.INFO,
      NotificationCategory.EMPLOYEE,
      savedEmployee.id,
      'employee',
    ).catch(err => console.error('Failed to create notification:', err));

    return savedEmployee;
  }

  async findAll(filters: FilterEmployeeDto): Promise<Employee[]> {
    const query = this.employeeRepository.createQueryBuilder('employee');

    query.where('employee.deletedAt IS NULL');

    if (filters.companyId) {
      query.andWhere('employee.companyId = :companyId', {
        companyId: filters.companyId,
      });
    }

    if (filters.search) {
      query.andWhere(
        '(employee.firstName LIKE :search OR employee.lastName LIKE :search OR employee.email LIKE :search OR employee.employeeId LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.department && filters.department.length > 0) {
      query.andWhere('employee.department IN (:...departments)', {
        departments: filters.department,
      });
    }

    if (filters.status && filters.status.length > 0) {
      query.andWhere('employee.status IN (:...statuses)', {
        statuses: filters.status,
      });
    }

    query.orderBy('employee.lastName', 'ASC').addOrderBy('employee.firstName', 'ASC');

    return await query.getMany();
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id, deletedAt: null },
      relations: [
        'company',
        'deviceAssignments',
        'deviceAssignments.device',
        'licenseAssignments',
        'licenseAssignments.license',
        'phoneAssignments',
        'phoneAssignments.phoneContract',
      ],
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return employee;
  }

  async update(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const employee = await this.findOne(id);

    // Check if email is being changed and conflicts
    if (updateEmployeeDto.email && updateEmployeeDto.email !== employee.email) {
      const existingEmployee = await this.employeeRepository.findOne({
        where: {
          email: updateEmployeeDto.email,
          companyId: employee.companyId,
        },
      });

      if (existingEmployee) {
        throw new ConflictException('Email already exists in this company');
      }
    }

    Object.assign(employee, updateEmployeeDto);
    return await this.employeeRepository.save(employee);
  }

  async remove(id: string): Promise<void> {
    const employee = await this.findOne(id);
    
    // Soft delete
    employee.deletedAt = new Date();
    await this.employeeRepository.save(employee);
  }

  async getAssignments(id: string): Promise<any> {
    const employee = await this.findOne(id);

    const activeDevices = employee.deviceAssignments
      .filter((a) => a.status === AssignmentStatus.ACTIVE)
      .map((a) => ({
        id: a.id,
        device: a.device,
        assignedDate: a.assignedDate,
        assignedBy: a.assignedBy,
      }));

    const activeLicenses = employee.licenseAssignments
      .filter((a) => a.status === AssignmentStatus.ACTIVE)
      .map((a) => ({
        id: a.id,
        license: a.license,
        assignedDate: a.assignedDate,
        assignedBy: a.assignedBy,
      }));

    const activePhoneContracts = employee.phoneAssignments
      .filter((a) => a.status === AssignmentStatus.ACTIVE)
      .map((a) => ({
        id: a.id,
        phoneContract: a.phoneContract,
        assignedDate: a.assignedDate,
        assignedBy: a.assignedBy,
      }));

    return {
      devices: activeDevices,
      licenses: activeLicenses,
      phoneContracts: activePhoneContracts,
      totalAssignments:
        activeDevices.length + activeLicenses.length + activePhoneContracts.length,
    };
  }

  async onboardEmployee(data: any): Promise<any> {
    // Create employee
    const employee = await this.create(data.employee);

    // Auto-assign standard equipment based on department/position
    const assignments = {
      employee,
      assignedDevices: [],
      assignedLicenses: [],
      assignedPhoneContract: null,
    };

    // This would integrate with the assignments module
    // to automatically assign standard equipment

    return assignments;
  }
}