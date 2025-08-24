import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
}

export enum AuthMethod {
  LOCAL = 'local',
  AZURE = 'azure',
}

@Entity('Users')
@Index(['email'], { unique: true })
@Index(['azureId'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 500, nullable: true })
  passwordHash: string | null; // NULL for SSO users

  @Column({ length: 255 })
  name: string;

  @Column({
    type: 'varchar',
    length: 20,
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ length: 100, nullable: true })
  department: string | null;

  @Column({ length: 255, nullable: true })
  azureId: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    enum: AuthMethod,
    default: AuthMethod.LOCAL,
  })
  authMethod: AuthMethod;

  @Column({ type: 'bit', default: true })
  isActive: boolean;

  @Column({ type: 'datetime2', nullable: true })
  lastLogin: Date | null;

  @Column({ length: 500, nullable: true })
  refreshToken: string | null;

  @Column({ type: 'datetime2', nullable: true })
  refreshTokenExpiry: Date | null;

  @Column({ type: 'text', nullable: true })
  selectedCompanyIds: string | null; // JSON array of selected company IDs

  @Column({ type: 'text', nullable: true })
  userSettings: string | null; // JSON object storing all user preferences and settings

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}