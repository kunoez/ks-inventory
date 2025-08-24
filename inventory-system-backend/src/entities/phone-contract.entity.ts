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
import { PhoneAssignment } from './phone-assignment.entity';

export enum ContractStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  ASSIGNED = 'assigned',
}

@Entity('PhoneContracts')
@Index(['phoneNumber', 'companyId'], { unique: true })
@Index(['status'])
export class PhoneContract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @ManyToOne(() => Company, (company) => company.phoneContracts)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ length: 50 })
  phoneNumber: string;

  @Column({ length: 100 })
  carrier: string;

  @Column({ length: 100 })
  plan: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monthlyFee: number;

  @Column({ type: 'date' })
  contractStartDate: Date;

  @Column({ type: 'date', nullable: true })
  contractEndDate: Date | null;

  @Column({ length: 50, nullable: true })
  pin: string | null; // Should be encrypted in production

  @Column({ length: 50, nullable: true })
  puk: string | null; // Should be encrypted in production

  @Column({
    type: 'varchar',
    length: 20,
    enum: ContractStatus,
    default: ContractStatus.ACTIVE,
  })
  status: ContractStatus;

  @Column({ length: 50, nullable: true })
  dataLimit: string | null;

  @Column({ length: 50, nullable: true })
  minutes: string | null;

  @Column({ length: 50, nullable: true })
  sms: string | null;

  @Column({ type: 'nvarchar', nullable: true })
  notes: string | null;

  @OneToMany(() => PhoneAssignment, (assignment) => assignment.phoneContract)
  assignments: PhoneAssignment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime2', nullable: true })
  deletedAt: Date | null;
}