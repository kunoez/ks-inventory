import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Company } from '../entities/company.entity';
import { User, UserRole } from '../entities/user.entity';
import { Employee, EmployeeStatus } from '../entities/employee.entity';
import { Device, DeviceStatus, DeviceType, DeviceCondition } from '../entities/device.entity';
import { License, LicenseStatus, LicenseType } from '../entities/license.entity';
import { PhoneContract, ContractStatus } from '../entities/phone-contract.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(License)
    private licenseRepository: Repository<License>,
    @InjectRepository(PhoneContract)
    private phoneContractRepository: Repository<PhoneContract>,
  ) {}

  async seed() {
    console.log('Starting database seed...');

    // Check if data already exists
    let company = await this.companyRepository.findOne({
      where: { name: 'Koch Industries' },
    });

    if (!company) {
      // Create company
      company = await this.companyRepository.save({
        name: 'Koch Industries',
        code: 'KOCH',
        description: 'Koch Industries GmbH',
        address: 'Hauptstraße 1',
        contactEmail: 'info@koch-industries.de',
        contactPhone: '+49 30 123456',
      });
      console.log('Company created');
    } else {
      console.log('Company already exists');
    }

    // Check if users exist
    const existingUsers = await this.userRepository.count();
    if (existingUsers > 0) {
      console.log('Users already exist, skipping user creation');
    } else {
      // Create admin user
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      const adminUser = await this.userRepository.save({
        email: 'admin@koch-industries.de',
        passwordHash: hashedPassword,
        name: 'Admin User',
        role: UserRole.ADMIN,
        department: 'IT',
        isActive: true,
      });

      // Create test users
      const managerUser = await this.userRepository.save({
        email: 'manager@koch-industries.de',
        passwordHash: hashedPassword,
        name: 'Manager User',
        role: UserRole.MANAGER,
        department: 'Operations',
        isActive: true,
      });

      const regularUser = await this.userRepository.save({
        email: 'user@koch-industries.de',
        passwordHash: hashedPassword,
        name: 'Regular User',
        role: UserRole.USER,
        department: 'Sales',
        isActive: true,
      });
      console.log('Users created');
    }

    // Check if employees exist
    const existingEmployees = await this.employeeRepository.count();
    if (existingEmployees > 0) {
      console.log('Employees already exist, skipping employee creation');
    } else {
      // Create employees
      const employees = [];
      const departments = ['IT', 'Sales', 'Marketing', 'HR', 'Engineering'];
      const positions = ['Manager', 'Senior Developer', 'Developer', 'Designer', 'Analyst'];

      for (let i = 1; i <= 10; i++) {
        const employee = await this.employeeRepository.save({
          employeeId: `EMP${String(i).padStart(3, '0')}`,
          firstName: `Employee${i}`,
          lastName: `Lastname${i}`,
          email: `employee${i}@koch-industries.de`,
          phone: `+49 30 12345${String(i).padStart(2, '0')}`,
          department: departments[i % departments.length],
          position: positions[i % positions.length],
          startDate: new Date('2023-01-01'),
          status: EmployeeStatus.ACTIVE,
          companyId: company.id,
        });
        employees.push(employee);
      }
      console.log('Employees created');
    }

    // Check if devices exist
    const existingDevices = await this.deviceRepository.count();
    if (existingDevices > 0) {
      console.log('Devices already exist, skipping device creation');
    } else {
      // Create devices
      const deviceTypes = [DeviceType.LAPTOP, DeviceType.DESKTOP, DeviceType.PHONE, DeviceType.TABLET, DeviceType.MONITOR];
      const brands = ['Dell', 'Apple', 'HP', 'Lenovo', 'Samsung'];
      const conditions = [DeviceCondition.EXCELLENT, DeviceCondition.GOOD, DeviceCondition.FAIR];

      for (let i = 1; i <= 20; i++) {
        await this.deviceRepository.save({
          name: `Device ${i}`,
          type: deviceTypes[i % deviceTypes.length],
          brand: brands[i % brands.length],
          model: `Model ${i}`,
          serialNumber: `SN${String(i).padStart(6, '0')}`,
          status: i <= 10 ? DeviceStatus.AVAILABLE : DeviceStatus.ASSIGNED,
          condition: conditions[i % conditions.length],
          purchaseDate: new Date('2023-01-01'),
          cost: Math.floor(Math.random() * 2000) + 500,
          warrantyEndDate: new Date('2025-12-31'),
          companyId: company.id,
        });
      }
      console.log('Devices created');
    }

    // Check if licenses exist
    const existingLicenses = await this.licenseRepository.count();
    if (existingLicenses > 0) {
      console.log('Licenses already exist, skipping license creation');
    } else {
      // Create licenses
      const softwareNames = ['Microsoft Office', 'Adobe Creative Cloud', 'JetBrains IDE', 'Slack', 'Zoom'];
      const licenseTypes = [LicenseType.SOFTWARE, LicenseType.SUBSCRIPTION, LicenseType.PERPETUAL, LicenseType.VOLUME];

      for (let i = 1; i <= 15; i++) {
        const maxUsers = Math.floor(Math.random() * 10) + 5;
        const currentUsers = Math.floor(Math.random() * maxUsers);
        await this.licenseRepository.save({
          name: softwareNames[i % softwareNames.length],
          type: licenseTypes[i % licenseTypes.length],
          licenseKey: `LIC-${String(i).padStart(4, '0')}-XXXX-XXXX`,
          maxUsers: maxUsers,
          currentUsers: currentUsers,
          cost: Math.floor(Math.random() * 500) + 50,
          purchaseDate: new Date('2023-01-01'),
          expiryDate: new Date('2024-12-31'),
          status: LicenseStatus.ACTIVE,
          vendor: 'Software Vendor',
          companyId: company.id,
        });
      }
      console.log('Licenses created');
    }

    // Check if phone contracts exist
    const existingContracts = await this.phoneContractRepository.count();
    if (existingContracts > 0) {
      console.log('Phone contracts already exist, skipping contract creation');
    } else {
      // Create phone contracts
      const providers = ['Telekom', 'Vodafone', 'O2'];
      const planTypes = ['unlimited', 'business', 'basic'];

      for (let i = 1; i <= 8; i++) {
        await this.phoneContractRepository.save({
          phoneNumber: `+49 170 ${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
          carrier: providers[i % providers.length],
          plan: planTypes[i % planTypes.length],
          monthlyFee: Math.floor(Math.random() * 50) + 30,
          dataLimit: `${Math.floor(Math.random() * 50) + 10} GB`,
          contractStartDate: new Date('2023-01-01'),
          contractEndDate: new Date('2025-12-31'),
          status: ContractStatus.ACTIVE,
          companyId: company.id,
        });
      }
      console.log('Phone contracts created');
    }

    console.log('\nDatabase seed completed!');
    console.log('\nLogin credentials:');
    console.log('- admin@koch-industries.de / Admin123!');
    console.log('- manager@koch-industries.de / Admin123!');
    console.log('- user@koch-industries.de / Admin123!');
  }
}