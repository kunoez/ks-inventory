import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, In } from 'typeorm';
import { Device, DeviceStatus } from '../entities/device.entity';
import { License, LicenseStatus } from '../entities/license.entity';
import { Employee, EmployeeStatus } from '../entities/employee.entity';
import { PhoneContract, ContractStatus } from '../entities/phone-contract.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(License)
    private licenseRepository: Repository<License>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(PhoneContract)
    private phoneContractRepository: Repository<PhoneContract>,
  ) {}

  async getStats(companyId?: string) {
    const whereClause = companyId ? { companyId } : {};

    // Get device statistics
    const totalDevices = await this.deviceRepository.count({ where: whereClause });
    const availableDevices = await this.deviceRepository.count({ 
      where: { ...whereClause, status: DeviceStatus.AVAILABLE } 
    });
    const assignedDevices = await this.deviceRepository.count({ 
      where: { ...whereClause, status: DeviceStatus.ASSIGNED } 
    });
    const maintenanceDevices = await this.deviceRepository.count({ 
      where: { ...whereClause, status: DeviceStatus.MAINTENANCE } 
    });

    // Get license statistics
    const totalLicenses = await this.licenseRepository.count({ where: whereClause });
    const activeLicenses = await this.licenseRepository.count({ 
      where: { ...whereClause, status: LicenseStatus.ACTIVE } 
    });
    
    // Get available license seats
    const licenses = await this.licenseRepository.find({ where: whereClause });
    const totalSeats = licenses.reduce((sum, l) => sum + l.maxUsers, 0);
    const usedSeats = licenses.reduce((sum, l) => sum + l.currentUsers, 0);
    const availableSeats = totalSeats - usedSeats;

    // Get employee statistics
    const totalEmployees = await this.employeeRepository.count({ where: whereClause });
    const activeEmployees = await this.employeeRepository.count({ 
      where: { ...whereClause, status: EmployeeStatus.ACTIVE } 
    });

    // Get phone contract statistics
    const totalPhoneContracts = await this.phoneContractRepository.count({ where: whereClause });
    const activeContracts = await this.phoneContractRepository.count({ 
      where: { ...whereClause, status: ContractStatus.ACTIVE } 
    });

    // Get licenses expiring in 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringLicenses = await this.licenseRepository.count({
      where: {
        ...whereClause,
        expiryDate: LessThan(thirtyDaysFromNow),
        status: LicenseStatus.ACTIVE,
      },
    });

    // Calculate utilization percentages
    const deviceUtilization = totalDevices > 0 
      ? Math.round((assignedDevices / totalDevices) * 100) 
      : 0;
    const licenseUtilization = totalSeats > 0 
      ? Math.round((usedSeats / totalSeats) * 100) 
      : 0;

    return {
      devices: {
        total: totalDevices,
        available: availableDevices,
        assigned: assignedDevices,
        maintenance: maintenanceDevices,
        utilization: deviceUtilization,
      },
      licenses: {
        total: totalLicenses,
        active: activeLicenses,
        totalSeats,
        usedSeats,
        availableSeats,
        utilization: licenseUtilization,
        expiringSoon: expiringLicenses,
      },
      employees: {
        total: totalEmployees,
        active: activeEmployees,
      },
      phoneContracts: {
        total: totalPhoneContracts,
        active: activeContracts,
      },
    };
  }

  async getResourceUtilization(companyId?: string) {
    const whereClause = companyId ? { companyId } : {};

    // Device utilization by type
    const deviceTypes = await this.deviceRepository
      .createQueryBuilder('device')
      .select('device.type', 'type')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN device.status = :assigned THEN 1 ELSE 0 END)', 'assigned')
      .where(companyId ? 'device.companyId = :companyId' : '1=1', { companyId })
      .setParameter('assigned', DeviceStatus.ASSIGNED)
      .groupBy('device.type')
      .getRawMany();

    // License utilization by vendor
    const licenseVendors = await this.licenseRepository
      .createQueryBuilder('license')
      .select('license.vendor', 'vendor')
      .addSelect('SUM(license.maxUsers)', 'totalSeats')
      .addSelect('SUM(license.currentUsers)', 'usedSeats')
      .where(companyId ? 'license.companyId = :companyId' : '1=1', { companyId })
      .groupBy('license.vendor')
      .getRawMany();

    return {
      devicesByType: deviceTypes.map(d => ({
        type: d.type,
        total: parseInt(d.total),
        assigned: parseInt(d.assigned || 0),
        utilization: parseInt(d.total) > 0 
          ? Math.round((parseInt(d.assigned || 0) / parseInt(d.total)) * 100)
          : 0,
      })),
      licensesByVendor: licenseVendors.map(l => ({
        vendor: l.vendor,
        totalSeats: parseInt(l.totalSeats || 0),
        usedSeats: parseInt(l.usedSeats || 0),
        utilization: parseInt(l.totalSeats) > 0
          ? Math.round((parseInt(l.usedSeats || 0) / parseInt(l.totalSeats || 0)) * 100)
          : 0,
      })),
    };
  }

  async getAlerts(companyId?: string) {
    const alerts = [];
    const whereClause = companyId ? { companyId } : {};

    // Check for expired and expiring licenses
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringLicenses = await this.licenseRepository.find({
      where: {
        ...whereClause,
        expiryDate: LessThan(thirtyDaysFromNow),
        status: In([LicenseStatus.ACTIVE, LicenseStatus.EXPIRED]),
      },
      take: 5,
      order: {
        expiryDate: 'ASC',
      },
    });

    expiringLicenses.forEach(license => {
      const daysUntilExpiry = Math.ceil(
        (new Date(license.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Only add alert if license hasn't expired yet
      if (daysUntilExpiry > 0) {
        alerts.push({
          type: daysUntilExpiry <= 7 ? 'critical' : 'warning',
          category: 'license',
          message: `License "${license.name}" expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`,
          timestamp: new Date(),
          entityId: license.id,
          entityName: license.name,
        });
      } else if (daysUntilExpiry === 0) {
        alerts.push({
          type: 'critical',
          category: 'license',
          message: `License "${license.name}" expires today`,
          timestamp: new Date(),
          entityId: license.id,
          entityName: license.name,
        });
      } else {
        // License has already expired
        const daysExpired = Math.abs(daysUntilExpiry);
        alerts.push({
          type: 'critical',
          category: 'license',
          message: `License "${license.name}" expired ${daysExpired} day${daysExpired === 1 ? '' : 's'} ago`,
          timestamp: new Date(),
          entityId: license.id,
          entityName: license.name,
        });
      }
    });

    // Check for low device availability
    const deviceStats = await this.getStats(companyId);
    if (deviceStats.devices.utilization > 90) {
      alerts.push({
        type: 'critical',
        category: 'device',
        message: `Device utilization at ${deviceStats.devices.utilization}% - consider purchasing more devices`,
        timestamp: new Date(),
      });
    }

    // Check for high license utilization
    if (deviceStats.licenses.utilization > 85) {
      alerts.push({
        type: 'warning',
        category: 'license',
        message: `License utilization at ${deviceStats.licenses.utilization}% - additional seats may be needed`,
        timestamp: new Date(),
      });
    }

    // Check for devices in maintenance
    if (deviceStats.devices.maintenance > 5) {
      alerts.push({
        type: 'info',
        category: 'device',
        message: `${deviceStats.devices.maintenance} devices currently in maintenance`,
        timestamp: new Date(),
      });
    }

    return alerts;
  }

  async getAvailableDevices(companyId?: string, limit: number = 10) {
    const whereClause = {
      ...companyId ? { companyId } : {},
      status: DeviceStatus.AVAILABLE,
    };

    const devices = await this.deviceRepository.find({
      where: whereClause,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return devices.map(device => ({
      id: device.id,
      name: device.name,
      type: device.type,
      brand: device.brand,
      model: device.model,
      serialNumber: device.serialNumber,
      condition: device.condition,
    }));
  }

  async getAvailableLicenses(companyId?: string, limit: number = 10) {
    const whereClause = {
      ...companyId ? { companyId } : {},
      status: LicenseStatus.ACTIVE,
    };

    const licenses = await this.licenseRepository.find({
      where: whereClause,
      order: {
        createdAt: 'DESC',
      },
    });

    // Filter licenses with available seats
    const availableLicenses = licenses
      .filter(license => license.currentUsers < license.maxUsers)
      .slice(0, limit);

    return availableLicenses.map(license => ({
      id: license.id,
      name: license.name,
      vendor: license.vendor,
      version: license.version,
      availableSeats: license.maxUsers - license.currentUsers,
      totalSeats: license.maxUsers,
    }));
  }
}