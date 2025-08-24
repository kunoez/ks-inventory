import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    // Check if company code already exists
    const existingCompany = await this.companyRepository.findOne({
      where: { code: createCompanyDto.code },
    });

    if (existingCompany) {
      throw new ConflictException('Company code already exists');
    }

    const company = this.companyRepository.create({
      ...createCompanyDto,
      status: createCompanyDto.status || 'active',
    });

    return await this.companyRepository.save(company);
  }

  async findAll(): Promise<Company[]> {
    return await this.companyRepository.find({
      where: { deletedAt: null },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['employees', 'devices', 'licenses', 'phoneContracts'],
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return company;
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    const company = await this.findOne(id);

    // Check if new code conflicts with existing
    if (updateCompanyDto.code && updateCompanyDto.code !== company.code) {
      const existingCompany = await this.companyRepository.findOne({
        where: { code: updateCompanyDto.code },
      });

      if (existingCompany) {
        throw new ConflictException('Company code already exists');
      }
    }

    Object.assign(company, updateCompanyDto);
    return await this.companyRepository.save(company);
  }

  async remove(id: string): Promise<void> {
    const company = await this.findOne(id);
    
    // Soft delete
    company.deletedAt = new Date();
    await this.companyRepository.save(company);
  }

  async getStats(id: string): Promise<any> {
    const company = await this.findOne(id);

    const stats = await this.companyRepository
      .createQueryBuilder('company')
      .leftJoin('company.employees', 'employee')
      .leftJoin('company.devices', 'device')
      .leftJoin('company.licenses', 'license')
      .leftJoin('company.phoneContracts', 'phoneContract')
      .where('company.id = :id', { id })
      .select('company.id', 'id')
      .addSelect('company.name', 'name')
      .addSelect('COUNT(DISTINCT employee.id)', 'totalEmployees')
      .addSelect(
        'COUNT(DISTINCT CASE WHEN employee.status = :active THEN employee.id END)',
        'activeEmployees',
      )
      .addSelect('COUNT(DISTINCT device.id)', 'totalDevices')
      .addSelect(
        'COUNT(DISTINCT CASE WHEN device.status = :available THEN device.id END)',
        'availableDevices',
      )
      .addSelect('COUNT(DISTINCT license.id)', 'totalLicenses')
      .addSelect('COUNT(DISTINCT phoneContract.id)', 'totalPhoneContracts')
      .setParameters({ active: 'active', available: 'available' })
      .groupBy('company.id')
      .addGroupBy('company.name')
      .getRawOne();

    return stats;
  }
}
