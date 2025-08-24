import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Device } from './device.entity';
import { Employee } from './employee.entity';

export enum AssignmentStatus {
  ACTIVE = 'active',
  RETURNED = 'returned',
  REVOKED = 'revoked',
  LOST = 'lost',
}

@Entity('DeviceAssignments')
@Index(['status'])
@Index(['employeeId'])
@Index(['deviceId'])
export class DeviceAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  deviceId: string;

  @ManyToOne(() => Device, (device) => device.assignments)
  @JoinColumn({ name: 'deviceId' })
  device: Device;

  @Column()
  employeeId: string;

  @ManyToOne(() => Employee, (employee) => employee.deviceAssignments)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column({ type: 'date' })
  assignedDate: Date;

  @Column({ type: 'date', nullable: true })
  returnDate: Date | null;

  @Column({
    type: 'varchar',
    length: 20,
    enum: AssignmentStatus,
    default: AssignmentStatus.ACTIVE,
  })
  status: AssignmentStatus;

  @Column({ type: 'nvarchar', nullable: true })
  notes: string | null;

  @Column({ length: 255 })
  assignedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}