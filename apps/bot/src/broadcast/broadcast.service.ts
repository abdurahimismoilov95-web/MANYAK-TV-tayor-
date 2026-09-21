import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BotService } from '../bot/bot.service';

interface BroadcastOptions {
  message: string;
  targetType: 'ALL' | 'VIP' | 'NON_VIP';
  imageUrl?: string;
}

@Injectable()
export class BroadcastService {
  constructor(
    private prisma: PrismaService,
    private botService: BotService,
  ) {}

  /**
   * Send broadcast message to users
   */
  async sendBroadcast(options: BroadcastOptions) {
    const { message, targetType, imageUrl } = options;

    // Get target users
    const users = await this.getTargetUsers(targetType);

    let successCount = 0;
    let failCount = 0;

    // Send messages
    for (const user of users) {
      try {
        const chatId = parseInt(user.telegramId);

        if (imageUrl) {
          await this.botService.getBot().telegram.sendPhoto(chatId, imageUrl, {
            caption: message,
            parse_mode: 'HTML',
          });
        } else {
          await this.botService.sendMessage(chatId, message, {
            parse_mode: 'HTML',
          });
        }

        successCount++;

        // Add small delay to avoid rate limiting
        await this.sleep(100);
      } catch (error) {
        failCount++;
        console.error(`Failed to send to ${user.telegramId}:`, error.message);
      }
    }

    // Save broadcast log
    await this.prisma.broadcastLog.create({
      data: {
        message,
        targetType,
        totalSent: successCount,
        totalFailed: failCount,
        imageUrl,
      },
    });

    return {
      success: true,
      totalUsers: users.length,
      successCount,
      failCount,
    };
  }

  /**
   * Get target users based on type
   */
  private async getTargetUsers(targetType: string) {
    const where: any = {};

    if (targetType === 'VIP') {
      where.isVip = true;
    } else if (targetType === 'NON_VIP') {
      where.isVip = false;
    }

    return this.prisma.user.findMany({
      where,
      select: { telegramId: true },
    });
  }

  /**
   * Get broadcast history
   */
  async getBroadcastHistory(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [broadcasts, total] = await Promise.all([
      this.prisma.broadcastLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.broadcastLog.count(),
    ]);

    return {
      broadcasts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Helper: sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
