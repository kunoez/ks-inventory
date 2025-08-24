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
import { LicenseAssignment } from './license-assignment.entity';
import { PhoneAssignment } from './phone-assignment.entity';

export enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TERMINATED = 'terminated',
}

@Entity('Employees')
@Index(['email', 'companyId'], { unique: true })
@Index(['employeeId', 'companyId'], { unique: true })
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @ManyToOne(() => Company, (company) => company.employees)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 100 })
  department: string;

  @Column({ length: 100 })
  position: string;

  @Column({ length: 50 })
  employeeId: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({
    type: 'varchar',
    length: 20,
    enum: EmployeeStatus,
    default: EmployeeStatus.ACTIVE,
  })
  status: EmployeeStatus;

  @OneToMany(() => DeviceAssignment, (assignment) => assignment.employee)
  deviceAssignments: DeviceAssignment[];

  @OneToMany(() => LicenseAssignment, (assignment) => assignment.employee)
  licenseAssignments: LicenseAssignment[];

  @OneToMany(() => PhoneAssignment, (assignment) => assignment.employee)
  phoneAssignments: PhoneAssignment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime2', nullable: true })
  deletedAt: Date | null;
}