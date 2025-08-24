import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

export enum NotificationCategory {
  DEVICE = 'device',
  LICENSE = 'license',
  EMPLOYEE = 'employee',
  SYSTEM = 'system',
  EXPIRY = 'expiry',
  ASSIGNMENT = 'assignment',
  MAINTENANCE = 'maintenance',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: NotificationType.INFO,
  })
  type: NotificationType;

  @Column({
    type: 'varchar',
    length: 20,
    default: NotificationCategory.SYSTEM,
  })
  category: NotificationCategory;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  entityId: string;

  @Column({ nullable: true })
  entityType: string;

  @Column({ nullable: true })
  actionUrl: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn()
  user: User;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  readAt: Date;
}