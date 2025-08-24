import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    let passwordHash = null;
    if (createUserDto.password) {
      // Hash password for local authentication
      passwordHash = await bcrypt.hash(createUserDto.password, 10);
    }

    const user = this.userRepository.create({
      ...createUserDto,
      passwordHash,
    });

    const savedUser = await this.userRepository.save(user);
    
    // Remove password from response
    delete savedUser.passwordHash;
    return savedUser;
  }

  async findAll(filters: FilterUserDto): Promise<User[]> {
    const query = this.userRepository.createQueryBuilder('user');

    query.where('user.isActive = :isActive', { isActive: true });

    if (filters.search) {
      query.andWhere(
        '(user.name LIKE :search OR user.email LIKE :search OR user.department LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.department) {
      query.andWhere('user.department = :department', {
        department: filters.department,
      });
    }

    if (filters.roles && filters.roles.length > 0) {
      query.andWhere('user.role IN (:...roles)', {
        roles: filters.roles,
      });
    }

    if (filters.authMethods && filters.authMethods.length > 0) {
      query.andWhere('user.authMethod IN (:...authMethods)', {
        authMethods: filters.authMethods,
      });
    }

    query.orderBy('user.name', 'ASC');

    const users = await query.getMany();
    
    // Remove password hashes from response
    return users.map(user => {
      delete user.passwordHash;
      return user;
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Convert selectedCompanyIds from JSON string to array
    if (user.selectedCompanyIds) {
      try {
        (user as any).selectedCompanyIds = JSON.parse(user.selectedCompanyIds);
      } catch {
        (user as any).selectedCompanyIds = [];
      }
    } else {
      (user as any).selectedCompanyIds = [];
    }

    // Convert userSettings from JSON string to object
    if (user.userSettings) {
      try {
        (user as any).userSettings = JSON.parse(user.userSettings);
      } catch {
        (user as any).userSettings = {};
      }
    } else {
      (user as any).userSettings = {};
    }

    delete user.passwordHash;
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Handle selectedCompanyIds specially - convert array to JSON string
    if (updateUserDto.selectedCompanyIds !== undefined) {
      user.selectedCompanyIds = JSON.stringify(updateUserDto.selectedCompanyIds);
      delete updateUserDto.selectedCompanyIds; // Remove from DTO to avoid overwriting
    }

    // Handle userSettings specially - convert object to JSON string
    if (updateUserDto.userSettings !== undefined) {
      user.userSettings = JSON.stringify(updateUserDto.userSettings);
      delete updateUserDto.userSettings; // Remove from DTO to avoid overwriting
    }

    Object.assign(user, updateUserDto);
    const savedUser = await this.userRepository.save(user);

    // Convert selectedCompanyIds back to array for response
    if (savedUser.selectedCompanyIds) {
      try {
        (savedUser as any).selectedCompanyIds = JSON.parse(savedUser.selectedCompanyIds);
      } catch {
        (savedUser as any).selectedCompanyIds = [];
      }
    }

    // Convert userSettings back to object for response
    if (savedUser.userSettings) {
      try {
        (savedUser as any).userSettings = JSON.parse(savedUser.userSettings);
      } catch {
        (savedUser as any).userSettings = {};
      }
    }

    delete savedUser.passwordHash;
    return savedUser;
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Soft delete by setting isActive to false
    user.isActive = false;
    await this.userRepository.save(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLogin: new Date() });
  }

  async updateRefreshToken(id: string, refreshToken: string, expiryDate: Date): Promise<void> {
    const hashedToken = refreshToken ? await bcrypt.hash(refreshToken, 10) : null;
    await this.userRepository.update(id, {
      refreshToken: hashedToken,
      refreshTokenExpiry: expiryDate,
    });
  }

  async validateRefreshToken(id: string, refreshToken: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'refreshToken', 'refreshTokenExpiry'],
    });

    if (!user || !user.refreshToken || !user.refreshTokenExpiry) {
      return false;
    }

    if (new Date() > user.refreshTokenExpiry) {
      return false;
    }

    return await bcrypt.compare(refreshToken, user.refreshToken);
  }
}