import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly algorithm = 'aes-256-cbc';
  private readonly encryptionKey: Buffer;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const key = this.configService.get<string>('ENCRYPTION_KEY', '');
    if (!key || key.length < 32) {
      this.logger.warn('ENCRYPTION_KEY is not set or too short; using fallback (NOT for production)');
    }
    // Derive a 32-byte key using MD5 hash (always 32 bytes)
    this.encryptionKey = crypto.createHash('sha256').update(key || 'default-encryption-key-change-me').digest();
  }

  async create(data: {
    email: string;
    name: string;
    passwordHash: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(userId: string, data: { name?: string; avatar?: string }) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
      },
    });
  }

  async updateMediumToken(userId: string, rawToken: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const encryptedToken = this.encrypt(rawToken);

    await this.prisma.user.update({
      where: { id: userId },
      data: { mediumToken: encryptedToken },
    });
  }

  async getMediumToken(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mediumToken: true },
    });

    if (!user?.mediumToken) return null;

    return this.decrypt(user.mediumToken);
  }

  async getPublicProfile(userId: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { passwordHash, mediumToken, ...profile } = user as any;
    return profile;
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
