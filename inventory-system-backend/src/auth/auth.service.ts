import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, AuthMethod } from '../entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && user.passwordHash) {
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (isPasswordValid) {
        return user;
      }
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<TokenResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    await this.updateLastLogin(user.id);

    return tokens;
  }

  async register(registerDto: RegisterDto): Promise<TokenResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      email: registerDto.email,
      passwordHash: hashedPassword,
      name: registerDto.name,
      department: registerDto.department,
      role: UserRole.USER,
      authMethod: AuthMethod.LOCAL,
      isActive: true,
    });

    await this.userRepository.save(user);

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<TokenResponseDto> {
    const user = await this.userRepository.findOne({
      where: { refreshToken: refreshTokenDto.refreshToken },
    });

    if (!user || !user.refreshTokenExpiry) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (user.refreshTokenExpiry < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      refreshToken: null,
      refreshTokenExpiry: null,
    });
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async getUserStats(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Get employee by user's email
    const employee = await this.userRepository.manager
      .createQueryBuilder('Employee', 'e')
      .where('e.email = :email', { email: user.email })
      .getOne();

    if (!employee) {
      return {
        devicesAssigned: 0,
        licensesUsed: 0,
        phoneContracts: 0,
      };
    }

    // Count assigned devices
    const devicesCount = await this.userRepository.manager
      .createQueryBuilder('DeviceAssignment', 'da')
      .where('da.employeeId = :employeeId', { employeeId: employee.id })
      .andWhere('da.returnedAt IS NULL')
      .getCount();

    // Count assigned licenses
    const licensesCount = await this.userRepository.manager
      .createQueryBuilder('LicenseAssignment', 'la')
      .where('la.employeeId = :employeeId', { employeeId: employee.id })
      .andWhere('la.returnedAt IS NULL')
      .getCount();

    // Count assigned phone contracts
    const phoneContractsCount = await this.userRepository.manager
      .createQueryBuilder('PhoneContractAssignment', 'pa')
      .where('pa.employeeId = :employeeId', { employeeId: employee.id })
      .andWhere('pa.returnedAt IS NULL')
      .getCount();

    return {
      devicesAssigned: devicesCount,
      licensesUsed: licensesCount,
      phoneContracts: phoneContractsCount,
    };
  }

  private async generateTokens(user: User): Promise<TokenResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: this.configService.get('jwt.expiresIn'),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('refreshToken.secret'),
      expiresIn: this.configService.get('refreshToken.expiresIn'),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get('jwt.expiresIn'),
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
      },
    };
  }

  private async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

    await this.userRepository.update(userId, {
      refreshToken,
      refreshTokenExpiry,
    });
  }

  private async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      lastLogin: new Date(),
    });
  }

  async loginWithAzure(azureData: any) {
    const { email, name, azureId, department } = azureData;

    // Check if user exists with this Azure AD ID
    let user = await this.userRepository.findOne({
      where: { azureId: azureId },
    });

    if (!user) {
      // Check if user exists with this email
      user = await this.userRepository.findOne({
        where: { email },
      });

      if (user) {
        // Update existing user with Azure AD ID
        user.azureId = azureId;
        if (name && !user.name) user.name = name;
        if (department && !user.department) user.department = department;
        await this.userRepository.save(user);
      } else {
        // Create new user
        user = await this.userRepository.save({
          email,
          name: name || email,
          azureId: azureId,
          department,
          role: UserRole.USER, // Default role
          isActive: true,
          passwordHash: '', // No password for Azure AD users
        });
      }
    }

    // Update last login
    await this.updateLastLogin(user.id);

    // Generate tokens
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Update refresh token
    await this.updateRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get('jwt.expiresIn'),
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
      },
    };
  }
}
