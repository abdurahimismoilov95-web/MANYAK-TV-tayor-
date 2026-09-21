import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { createHmac } from 'crypto';

export interface JwtPayload {
  sub: string; // user ID
  telegramId: string;
  isVip: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  /**
   * Verify Telegram Web App initData
   * HMAC validation against bot token
   */
  async verifyTelegramInitData(initData: string): Promise<any> {
    const botToken = this.config.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new UnauthorizedException('Bot token not configured');
    }

    // Parse initData
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    // Sort and create data-check-string
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Compute HMAC-SHA256
    const secretKey = createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();
    
    const computedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Validate hash
    if (hash !== computedHash) {
      throw new UnauthorizedException('Invalid Telegram data');
    }

    // Parse user data
    const userDataString = urlParams.get('user');
    if (!userDataString) {
      throw new UnauthorizedException('User data not found');
    }

    const userData = JSON.parse(userDataString);
    return userData;
  }

  /**
   * Login or register user via Telegram
   */
  async loginWithTelegram(initData: string) {
    // 1. Verify initData
    const telegramUser = await this.verifyTelegramInitData(initData);

    // 2. Find or create user
    let user = await this.prisma.user.findUnique({
      where: { telegramId: String(telegramUser.id) },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          telegramId: String(telegramUser.id),
          firstName: telegramUser.first_name || 'User',
          lastName: telegramUser.last_name,
          username: telegramUser.username,
          lastLoginAt: new Date(),
        },
      });
    } else {
      // Update last login
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    // 3. Check if user is admin
    const admin = await this.prisma.admin.findUnique({
      where: { telegramId: user.telegramId },
    });

    // 4. Generate JWT
    const payload: JwtPayload = {
      sub: user.id,
      telegramId: user.telegramId,
      isVip: user.isVip,
      isAdmin: !!admin,
      isSuperAdmin: admin?.isSuperAdmin || false,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      ok: true,
      token: accessToken,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        isVip: user.isVip,
        isAdmin: !!admin,
        isSuperAdmin: admin?.isSuperAdmin || false,
      },
    };
  }

  /**
   * Validate JWT and return user
   */
  async validateUser(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('User is banned');
    }

    return user;
  }

  /**
   * Get current user with admin info
   */
  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const admin = await this.prisma.admin.findUnique({
      where: { telegramId: user.telegramId },
    });

    return {
      ...user,
      isAdmin: !!admin,
      isSuperAdmin: admin?.isSuperAdmin || false,
      adminPermissions: admin?.permissions,
    };
  }
}
