import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PhoneContract } from '../entities/phone-contract.entity';
import { PhoneAssignment } from '../entities/phone-assignment.entity';
import { AssignmentStatus } from '../entities/device-assignment.entity';
import { CreatePhoneContractDto } from './dto/create-phone-contract.dto';
import { UpdatePhoneContractDto } from './dto/update-phone-contract.dto';
import { FilterPhoneContractDto } from './dto/filter-phone-contract.dto';

@Injectable()
export class PhoneContractsService {
  constructor(
    @InjectRepository(PhoneContract)
    private phoneContractRepository: Repository<PhoneContract>,
    @InjectRepository(PhoneAssignment)
    private phoneAssignmentRepository: Repository<PhoneAssignment>,
  ) {}

  async create(createPhoneContractDto: CreatePhoneContractDto): Promise<PhoneContract> {
    // Check if phone number already exists in the company
    const existingContract = await this.phoneContractRepository.findOne({
      where: {
        phoneNumber: createPhoneContractDto.phoneNumber,
        companyId: createPhoneContractDto.companyId,
        deletedAt: null,
      },
    });

    if (existingContract) {
      throw new ConflictException(
        'Phone number already exists in this company',
      );
    }

    const phoneContract = this.phoneContractRepository.create({
      ...createPhoneContractDto,
      contractStartDate: new Date(createPhoneContractDto.contractStartDate),
      contractEndDate: createPhoneContractDto.contractEndDate 
        ? new Date(createPhoneContractDto.contractEndDate) 
        : null,
    });

    return await this.phoneContractRepository.save(phoneContract);
  }

  async findAll(filters: FilterPhoneContractDto): Promise<PhoneContract[]> {
    const query = this.phoneContractRepository.createQueryBuilder('phoneContract');

    query.where('phoneContract.deletedAt IS NULL');

    if (filters.companyId) {
      query.andWhere('phoneContract.companyId = :companyId', {
        companyId: filters.companyId,
      });
    }

    if (filters.search) {
      query.andWhere(
        '(phoneContract.phoneNumber LIKE :search OR phoneContract.carrier LIKE :search OR phoneContract.plan LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.carrier) {
      query.andWhere('phoneContract.carrier = :carrier', {
        carrier: filters.carrier,
      });
    }

    if (filters.statuses && filters.statuses.length > 0) {
      query.andWhere('phoneContract.status IN (:...statuses)', {
        statuses: filters.statuses,
      });
    }

    if (filters.expiringBefore) {
      query.andWhere('phoneContract.contractEndDate <= :expiringBefore', {
        expiringBefore: new Date(filters.expiringBefore),
      });
    }

    query
      .leftJoinAndSelect('phoneContract.company', 'company')
      .orderBy('phoneContract.phoneNumber', 'ASC');

    return await query.getMany();
  }

  async findOne(id: string): Promise<PhoneContract> {
    const phoneContract = await this.phoneContractRepository.findOne({
      where: { id, deletedAt: null },
      relations: [
        'company',
        'assignments',
        'assignments.employee',
      ],
    });

    if (!phoneContract) {
      throw new NotFoundException(`Phone contract with ID ${id} not found`);
    }

    return phoneContract;
  }

  async update(
    id: string,
    updatePhoneContractDto: UpdatePhoneContractDto,
  ): Promise<PhoneContract> {
    const phoneContract = await this.findOne(id);

    if (updatePhoneContractDto.contractStartDate) {
      updatePhoneContractDto.contractStartDate = new Date(updatePhoneContractDto.contractStartDate) as any;
    }

    if (updatePhoneContractDto.contractEndDate) {
      updatePhoneContractDto.contractEndDate = new Date(updatePhoneContractDto.contractEndDate) as any;
    }

    Object.assign(phoneContract, updatePhoneContractDto);
    return await this.phoneContractRepository.save(phoneContract);
  }

  async remove(id: string): Promise<void> {
    const phoneContract = await this.findOne(id);
    
    // Check if phone contract has active assignments
    const activeAssignments = await this.phoneAssignmentRepository.count({
      where: { phoneContractId: id, status: AssignmentStatus.ACTIVE },
    });

    if (activeAssignments > 0) {
      throw new ConflictException(
        'Cannot delete phone contract with active assignments. Please unassign all users first.',
      );
    }

    // Soft delete
    phoneContract.deletedAt = new Date();
    await this.phoneContractRepository.save(phoneContract);
  }

  async getAssignments(id: string): Promise<any> {
    const phoneContract = await this.findOne(id);

    const activeAssignments = phoneContract.assignments
      .filter((a) => a.status === 'active')
      .map((a) => ({
        id: a.id,
        employee: a.employee,
        assignedDate: a.assignedDate,
        assignedBy: a.assignedBy,
      }));

    return {
      phoneContract: {
        id: phoneContract.id,
        phoneNumber: phoneContract.phoneNumber,
        carrier: phoneContract.carrier,
        plan: phoneContract.plan,
        monthlyFee: phoneContract.monthlyFee,
      },
      assignments: activeAssignments,
      isAssigned: activeAssignments.length > 0,
    };
  }

  async getExpiringContracts(days: number = 30): Promise<PhoneContract[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    return await this.phoneContractRepository.find({
      where: {
        contractEndDate: LessThan(cutoffDate),
        deletedAt: null,
      },
      relations: ['company'],
      order: {
        contractEndDate: 'ASC',
      },
    });
  }

  async getAvailableContracts(companyId?: string): Promise<PhoneContract[]> {
    const query = this.phoneContractRepository.createQueryBuilder('phoneContract')
      .leftJoin('phoneContract.assignments', 'assignment', 'assignment.status = :status', { status: 'active' })
      .where('phoneContract.deletedAt IS NULL')
      .andWhere('phoneContract.status = :contractStatus', { contractStatus: 'active' })
      .andWhere('assignment.id IS NULL'); // No active assignments

    if (companyId) {
      query.andWhere('phoneContract.companyId = :companyId', { companyId });
    }

    return await query.getMany();
  }
}