import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * User VIP Service - VIP subscription management
 * Responsibilities: VIP status, expiration, renewal
 * Max 150 lines - Single Responsibility Principle
 */
@Injectable()
export class UsersVipService {
  constructor(private prisma: PrismaService) {}

  /**
   * Grant VIP status to user
   */
  async grantVip(userId: string, durationDays: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isVip: true,
        vipExpiresAt: expiresAt,
      },
    });
  }

  /**
   * Revoke VIP status
   */
  async revokeVip(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isVip: false,
        vipExpiresAt: null,
      },
    });
  }

  /**
   * Check if user's VIP is expired and update
   */
  async checkVipExpiration(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVip && user.vipExpiresAt && user.vipExpiresAt < new Date()) {
      await this.revokeVip(userId);
      return { expired: true, user };
    }

    return { expired: false, user };
  }

  /**
   * Get all VIP users
   */
  async getVipUsers(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { isVip: true },
        skip,
        take: limit,
        orderBy: { vipExpiresAt: 'asc' },
      }),
      this.prisma.user.count({ where: { isVip: true } }),
    ]);

    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get expiring VIP users (within 7 days)
   */
  async getExpiringVipUsers() {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    return this.prisma.user.findMany({
      where: {
        isVip: true,
        vipExpiresAt: {
          lte: sevenDaysFromNow,
          gte: new Date(),
        },
      },
      orderBy: { vipExpiresAt: 'asc' },
    });
  }

  /**
   * Extend VIP subscription
   */
  async extendVip(userId: string, additionalDays: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let newExpiryDate: Date;

    if (user.isVip && user.vipExpiresAt && user.vipExpiresAt > new Date()) {
      // Extend from current expiry
      newExpiryDate = new Date(user.vipExpiresAt);
      newExpiryDate.setDate(newExpiryDate.getDate() + additionalDays);
    } else {
      // Start from today
      newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + additionalDays);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isVip: true,
        vipExpiresAt: newExpiryDate,
      },
    });
  }

  /**
   * Get VIP statistics
   */
  async getVipStats() {
    const [totalVip, active, expiringSoon] = await Promise.all([
      this.prisma.user.count({ where: { isVip: true } }),
      this.prisma.user.count({
        where: {
          isVip: true,
          vipExpiresAt: { gt: new Date() },
        },
      }),
      this.prisma.user.count({
        where: {
          isVip: true,
          vipExpiresAt: {
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            gt: new Date(),
          },
        },
      }),
    ]);

    return { totalVip, active, expiringSoon };
  }
}
