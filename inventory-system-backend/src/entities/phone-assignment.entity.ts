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
import { PhoneContract } from './phone-contract.entity';
import { Employee } from './employee.entity';
import { AssignmentStatus } from './device-assignment.entity';

@Entity('PhoneAssignments')
@Index(['status'])
@Index(['employeeId'])
export class PhoneAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  phoneContractId: string;

  @ManyToOne(() => PhoneContract, (contract) => contract.assignments)
  @JoinColumn({ name: 'phoneContractId' })
  phoneContract: PhoneContract;

  @Column()
  employeeId: string;

  @ManyToOne(() => Employee, (employee) => employee.phoneAssignments)
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