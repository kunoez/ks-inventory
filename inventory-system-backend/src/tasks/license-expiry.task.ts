import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { License, LicenseStatus } from '../entities/license.entity';
import { NotificationService } from '../notifications/notification.service';
import { NotificationCategory, NotificationType } from '../entities/notification.entity';

@Injectable()
export class LicenseExpiryTask {
  constructor(
    @InjectRepository(License)
    private licenseRepository: Repository<License>,
    private notificationService: NotificationService,
  ) {}

  // Run every day at 9:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkExpiringLicenses() {
    console.log('Checking for expiring licenses...');
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find licenses expiring in the next 30 days
    const expiringLicenses = await this.licenseRepository.find({
      where: {
        expiryDate: LessThan(thirtyDaysFromNow),
        status: LicenseStatus.ACTIVE,
      },
    });

    for (const license of expiringLicenses) {
      const daysUntilExpiry = Math.ceil(
        (new Date(license.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only create notifications for licenses we haven't notified about today
      const existingNotification = await this.notificationService.findByEntityAndDate(
        license.id,
        'license',
        today,
      ).catch(() => null);

      if (!existingNotification && license.companyId) {
        if (daysUntilExpiry <= 0) {
          // License has expired
          await this.notificationService.createCompanyWideNotification(
            license.companyId,
            'License Expired',
            `License "${license.name}" has expired`,
            NotificationType.ERROR,
            NotificationCategory.LICENSE,
            license.id,
            'license',
          ).catch(err => console.error('Failed to create expiry notification:', err));
        } else if (daysUntilExpiry <= 7) {
          // Critical - expiring within a week
          await this.notificationService.createCompanyWideNotification(
            license.companyId,
            'License Expiring Very Soon',
            `License "${license.name}" will expire in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`,
            NotificationType.ERROR,
            NotificationCategory.LICENSE,
            license.id,
            'license',
          ).catch(err => console.error('Failed to create expiry notification:', err));
        } else if (daysUntilExpiry <= 30) {
          // Warning - expiring within a month
          await this.notificationService.createCompanyWideNotification(
            license.companyId,
            'License Expiring Soon',
            `License "${license.name}" will expire in ${daysUntilExpiry} days`,
            NotificationType.WARNING,
            NotificationCategory.LICENSE,
            license.id,
            'license',
          ).catch(err => console.error('Failed to create expiry notification:', err));
        }
      }
    }

    console.log(`Checked ${expiringLicenses.length} expiring licenses`);
  }

  // Also check immediately on startup
  async onModuleInit() {
    // Wait 10 seconds after startup to check
    setTimeout(() => {
      this.checkExpiringLicenses();
    }, 10000);
  }
}