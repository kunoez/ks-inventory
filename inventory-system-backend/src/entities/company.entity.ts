import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Employee } from './employee.entity';
import { Device } from './device.entity';
import { License } from './license.entity';
import { PhoneContract } from './phone-contract.entity';

@Entity('Companies')
@Index(['code'], { unique: true })
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ type: 'nvarchar', nullable: true })
  description: string;

  @Column({ length: 500, nullable: true })
  address: string;

  @Column({ length: 255, nullable: true })
  contactEmail: string;

  @Column({ length: 50, nullable: true })
  contactPhone: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  status: 'active' | 'inactive';

  @OneToMany(() => Employee, (employee) => employee.company)
  employees: Employee[];

  @OneToMany(() => Device, (device) => device.company)
  devices: Device[];

  @OneToMany(() => License, (license) => license.company)
  licenses: License[];

  @OneToMany(() => PhoneContract, (contract) => contract.company)
  phoneContracts: PhoneContract[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime2', nullable: true })
  deletedAt: Date | null;
}