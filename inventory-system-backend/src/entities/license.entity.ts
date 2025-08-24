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
  Check,
} from 'typeorm';
import { Company } from './company.entity';
import { LicenseAssignment } from './license-assignment.entity';

export enum LicenseType {
  SOFTWARE = 'software',
  SUBSCRIPTION = 'subscription',
  PERPETUAL = 'perpetual',
  VOLUME = 'volume',
  OEM = 'oem',
}

export enum LicenseStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

@Entity('Licenses')
@Index(['expiryDate'])
@Index(['vendor'])
@Check('"currentUsers" <= "maxUsers"')
export class License {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @ManyToOne(() => Company, (company) => company.licenses)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ length: 255 })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    enum: LicenseType,
  })
  type: LicenseType;

  @Column({ length: 100 })
  vendor: string;

  @Column({ length: 50, nullable: true })
  version: string | null;

  @Column({ length: 500, nullable: true })
  licenseKey: string | null; // Should be encrypted in production

  @Column({ type: 'date' })
  purchaseDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cost: number;

  @Column({ type: 'int' })
  maxUsers: number;

  @Column({ type: 'int', default: 0 })
  currentUsers: number;

  @Column({
    type: 'varchar',
    length: 20,
    enum: LicenseStatus,
    default: LicenseStatus.ACTIVE,
  })
  status: LicenseStatus;

  @Column({ type: 'nvarchar', nullable: true })
  notes: string | null;

  @OneToMany(() => LicenseAssignment, (assignment) => assignment.license)
  assignments: LicenseAssignment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime2', nullable: true })
  deletedAt: Date | null;
}