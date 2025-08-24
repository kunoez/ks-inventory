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
import { License } from './license.entity';
import { Employee } from './employee.entity';
import { AssignmentStatus } from './device-assignment.entity';

@Entity('LicenseAssignments')
@Index(['status'])
@Index(['employeeId'])
@Index(['licenseId'])
export class LicenseAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  licenseId: string;

  @ManyToOne(() => License, (license) => license.assignments)
  @JoinColumn({ name: 'licenseId' })
  license: License;

  @Column()
  employeeId: string;

  @ManyToOne(() => Employee, (employee) => employee.licenseAssignments)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column({ type: 'date' })
  assignedDate: Date;

  @Column({ type: 'date', nullable: true })
  revokedDate: Date | null;

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