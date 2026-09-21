import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto, GrantVipDto, BanUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get user profile by ID
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        favorites: {
          include: {
            content: {
              select: {
                id: true,
                title: true,
                posterUrl: true,
                type: true,
              },
            },
          },
        },
        watchHistory: {
          include: {
            content: {
              select: {
                id: true,
                title: true,
                posterUrl: true,
                type: true,
              },
            },
          },
          orderBy: { watchedAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if admin
    const admin = await this.prisma.admin.findUnique({
      where: { telegramId: user.telegramId },
    });

    return {
      ...user,
      isAdmin: !!admin,
      isSuperAdmin: admin?.isSuperAdmin || false,
    };
  }

  /**
   * Get user by Telegram ID
   */
  async findByTelegramId(telegramId: string) {
    const user = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  /**
   * Grant VIP subscription to user
   */
  async grantVip(id: string, grantVipDto: GrantVipDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + grantVipDto.durationDays);

    return this.prisma.user.update({
      where: { id },
      data: {
        isVip: true,
        vipExpiresAt: expiresAt,
      },
    });
  }

  /**
   * Remove VIP subscription
   */
  async revokeVip(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        isVip: false,
        vipExpiresAt: null,
      },
    });
  }

  /**
   * Ban user
   */
  async banUser(id: string, banDto: BanUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        isBanned: true,
        banReason: banDto.reason,
      },
    });
  }

  /**
   * Unban user
   */
  async unbanUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        isBanned: false,
        banReason: null,
      },
    });
  }

  /**
   * Get all users (admin only)
   */
  async findAll(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          telegramId: true,
          firstName: true,
          lastName: true,
          username: true,
          isVip: true,
          vipExpiresAt: true,
          isBanned: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get user statistics
   */
  async getStats() {
    const [
      totalUsers,
      vipUsers,
      bannedUsers,
      activeToday,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isVip: true } }),
      this.prisma.user.count({ where: { isBanned: true } }),
      this.prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      totalUsers,
      vipUsers,
      bannedUsers,
      activeToday,
    };
  }

  /**
   * Add to favorites
   */
  async addFavorite(userId: string, contentId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const content = await this.prisma.content.findUnique({ where: { id: contentId } });
    if (!content) throw new NotFoundException('Content not found');

    return this.prisma.favorite.create({
      data: {
        userId,
        contentId,
      },
    });
  }

  /**
   * Remove from favorites
   */
  async removeFavorite(userId: string, contentId: string) {
    return this.prisma.favorite.delete({
      where: {
        userId_contentId: {
          userId,
          contentId,
        },
      },
    });
  }

  /**
   * Get user favorites
   */
  async getFavorites(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        content: true,
      },
      orderBy: { addedAt: 'desc' },
    });

    return favorites.map((f: any) => f.content);
  }

  /**
   * Get watch history
   */
  async getWatchHistory(userId: string, limit: number = 20) {
    return this.prisma.watchHistory.findMany({
      where: { userId },
      include: {
        content: true,
      },
      orderBy: { watchedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Update watch progress
   */
  async updateWatchProgress(
    userId: string,
    contentId: string,
    progressSeconds: number,
    totalSeconds: number,
    episodeId?: string,
  ) {
    return this.prisma.watchHistory.create({
      data: {
        userId,
        contentId,
        episodeId,
        progressSeconds,
        totalSeconds,
      },
    });
  }
}
