import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from './company.entity';

export enum ReportType {
  DEVICE_INVENTORY = 'device_inventory',
  LICENSE_COMPLIANCE = 'license_compliance',
  COST_ANALYSIS = 'cost_analysis',
  EMPLOYEE_ASSET = 'employee_asset',
  PHONE_CONTRACT = 'phone_contract',
  FINANCIAL_OVERVIEW = 'financial_overview',
  EXPIRING_LICENSES = 'expiring_licenses',
  MAINTENANCE_SCHEDULE = 'maintenance_schedule',
}

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'Excel',
  CSV = 'CSV',
  JSON = 'JSON',
}

@Entity('report_activities')
export class ReportActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  reportType: ReportType;

  @Column()
  reportName: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  format: ReportFormat;

  @Column()
  generatedBy: string;

  @Column({ nullable: true })
  generatedByEmail: string;

  @Column({ nullable: true })
  generatedByUserId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  parameters: string;

  @Column({ nullable: true })
  filePath: string;

  @Column({ default: 0 })
  fileSize: number;

  @Column({ default: 0 })
  recordCount: number;

  @Column({ default: true })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn()
  company: Company;

  @Column({ nullable: true })
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;
}