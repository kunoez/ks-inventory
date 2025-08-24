import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Company } from './company.entity';
import { DeviceAssignment } from './device-assignment.entity';

export enum DeviceType {
  LAPTOP = 'laptop',
  DESKTOP = 'desktop',
  MONITOR = 'monitor',
  PHONE = 'phone',
  TABLET = 'tablet',
  PRINTER = 'printer',
  KEYBOARD = 'keyboard',
  MOUSE = 'mouse',
  HEADSET = 'headset',
  DOCK = 'dock',
  OTHER = 'other',
}

export enum DeviceStatus {
  AVAILABLE = 'available',
  ASSIGNED = 'assigned',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
  LOST = 'lost',
  DAMAGED = 'damaged',
}

export enum DeviceCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

@Entity('Devices')
@Index(['serialNumber', 'companyId'], { unique: true })
@Index(['status'])
@Index(['type'])
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @ManyToOne(() => Company, (company) => company.devices)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ length: 255 })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    enum: DeviceType,
  })
  type: DeviceType;

  @Column({ length: 100 })
  brand: string;

  @Column({ length: 100 })
  model: string;

  @Column({ length: 100 })
  serialNumber: string;

  @Column({ type: 'date' })
  purchaseDate: Date;

  @Column({ type: 'date', nullable: true })
  warrantyExpiry: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cost: number;

  @Column({
    type: 'varchar',
    length: 20,
    enum: DeviceStatus,
    default: DeviceStatus.AVAILABLE,
  })
  status: DeviceStatus;

  @Column({
    type: 'varchar',
    length: 20,
    enum: DeviceCondition,
    default: DeviceCondition.GOOD,
  })
  condition: DeviceCondition;

  @Column({ length: 255, nullable: true })
  location: string | null;

  @Column({ type: 'nvarchar', nullable: true })
  notes: string | null;

  @OneToMany(() => DeviceAssignment, (assignment) => assignment.device)
  assignments: DeviceAssignment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime2', nullable: true })
  deletedAt: Date | null;
}