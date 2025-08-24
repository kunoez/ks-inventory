import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Notification, NotificationType, NotificationCategory } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      type: createNotificationDto.type || NotificationType.INFO,
      category: createNotificationDto.category || NotificationCategory.SYSTEM,
    });
    return this.notificationRepository.save(notification);
  }

  async findAll(userId: string, limit: number = 50): Promise<Notification[]> {
    const takeLimit = Number(limit) || 50; // Ensure limit is a number
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: takeLimit,
    });
  }

  async findUnread(userId: string): Promise<Notification[]> {
    console.log('Finding unread notifications for user:', userId);
    const notifications = await this.notificationRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
    });
    console.log('Found unread notifications:', notifications.length);
    return notifications;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    console.log('Marking all notifications as read for user:', userId);
    const result = await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    console.log('Update result:', result);
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.notificationRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  async deleteAll(userId: string): Promise<void> {
    await this.notificationRepository.delete({ userId });
  }

  // Create notifications for all users in a company
  async createCompanyWideNotification(
    companyId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    category: NotificationCategory = NotificationCategory.SYSTEM,
    entityId?: string,
    entityType?: string,
  ): Promise<void> {
    // Find all users that have access to this company
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.selectedCompanyIds LIKE :companyId', { companyId: `%${companyId}%` })
      .getMany();

    // Create notification for each user
    const notifications = users.map(user => 
      this.notificationRepository.create({
        userId: user.id,
        companyId,
        title,
        message,
        type,
        category,
        entityId,
        entityType,
      })
    );

    if (notifications.length > 0) {
      await this.notificationRepository.save(notifications);
    }
  }

  // Helper method to create system notifications
  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    category: NotificationCategory = NotificationCategory.SYSTEM,
    entityId?: string,
    entityType?: string,
    actionUrl?: string,
  ): Promise<Notification> {
    return this.create({
      userId,
      title,
      message,
      type,
      category,
      entityId,
      entityType,
      actionUrl,
    });
  }

  // Create notifications for license expiry
  async createLicenseExpiryNotification(
    userId: string,
    licenseName: string,
    daysUntilExpiry: number,
    licenseId: string,
  ): Promise<Notification> {
    const title = 'License Expiring Soon';
    const message = `License "${licenseName}" will expire in ${daysUntilExpiry} days.`;
    
    return this.createSystemNotification(
      userId,
      title,
      message,
      NotificationType.WARNING,
      NotificationCategory.EXPIRY,
      licenseId,
      'license',
      `/licenses/${licenseId}`,
    );
  }

  // Create notifications for device warranty expiry
  async createWarrantyExpiryNotification(
    userId: string,
    deviceName: string,
    daysUntilExpiry: number,
    deviceId: string,
  ): Promise<Notification> {
    const title = 'Warranty Expiring Soon';
    const message = `Device "${deviceName}" warranty will expire in ${daysUntilExpiry} days.`;
    
    return this.createSystemNotification(
      userId,
      title,
      message,
      NotificationType.WARNING,
      NotificationCategory.EXPIRY,
      deviceId,
      'device',
      `/devices/${deviceId}`,
    );
  }

  // Create notifications for new assignments
  async createAssignmentNotification(
    userId: string,
    itemType: 'device' | 'license' | 'phone',
    itemName: string,
    itemId: string,
  ): Promise<Notification> {
    const title = `New ${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Assignment`;
    const message = `You have been assigned: ${itemName}`;
    
    return this.createSystemNotification(
      userId,
      title,
      message,
      NotificationType.INFO,
      NotificationCategory.ASSIGNMENT,
      itemId,
      itemType,
      `/${itemType}s/${itemId}`,
    );
  }

  // Create notifications for low license seats
  async createLowSeatsNotification(
    userId: string,
    licenseName: string,
    availableSeats: number,
    licenseId: string,
  ): Promise<Notification> {
    const title = 'Low License Seats Available';
    const message = `License "${licenseName}" has only ${availableSeats} seats remaining.`;
    
    return this.createSystemNotification(
      userId,
      title,
      message,
      NotificationType.WARNING,
      NotificationCategory.LICENSE,
      licenseId,
      'license',
      `/licenses/${licenseId}`,
    );
  }

  // Get notifications by category
  async findByCategory(userId: string, category: NotificationCategory): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId, category },
      order: { createdAt: 'DESC' },
    });
  }

  // Delete old notifications (cleanup)
  async deleteOldNotifications(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .andWhere('isRead = :isRead', { isRead: true })
      .execute();
  }

  // Find notification by entity and date (to prevent duplicates)
  async findByEntityAndDate(
    entityId: string,
    entityType: string,
    date: Date,
  ): Promise<Notification | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.notificationRepository.findOne({
      where: {
        entityId,
        entityType,
        createdAt: Between(startOfDay, endOfDay),
      },
    });
  }
}