import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Markup } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommandsService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async handleStart(ctx: any) {
    const userId = ctx.from.id;
    const username = ctx.from.username || '';
    const firstName = ctx.from.first_name || '';
    const lastName = ctx.from.last_name || '';

    // Save or update user in database
    await this.prisma.user.upsert({
      where: { telegramId: userId.toString() },
      update: {
        username,
        firstName,
        lastName,
        lastActiveAt: new Date(),
      },
      create: {
        telegramId: userId.toString(),
        username,
        firstName,
        lastName,
        isVip: false,
      },
    });

    const webAppUrl = this.config.get('WEB_APP_URL');

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.webApp('🎬 Open MANYAK TV', webAppUrl)],
      [Markup.button.callback('💎 VIP Subscription', 'vip_info')],
      [Markup.button.callback('ℹ️ Help', 'help')],
    ]);

    await ctx.reply(
      `👋 Salom, ${firstName}!\n\n` +
        `🎬 MANYAK TV - O'zbek kinoları va seriallar platformasiga xush kelibsiz!\n\n` +
        `🎯 Bu yerda:\n` +
        `✅ Barcha O'zbek kinolar\n` +
        `✅ Seriallar va Multfilmlar\n` +
        `✅ HD sifat\n` +
        `✅ Har kuni yangiliklar\n\n` +
        `🚀 Boshlash uchun tugmani bosing:`,
      keyboard,
    );
  }

  async handleVip(ctx: any) {
    const userId = ctx.from.id.toString();

    // Get user VIP status
    const user = await this.prisma.user.findUnique({
      where: { telegramId: userId },
    });

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('💳 Subscribe to VIP', 'subscribe_vip')],
      [Markup.button.callback('« Back', 'back_to_start')],
    ]);

    if (user?.isVip && user?.vipExpiresAt) {
      const daysLeft = Math.ceil(
        (user.vipExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      await ctx.reply(
        `💎 VIP Status: ACTIVE ✅\n\n` +
          `⏱ Expires in: ${daysLeft} days\n` +
          `📅 Valid until: ${user.vipExpiresAt.toLocaleDateString()}\n\n` +
          `🎁 VIP Benefits:\n` +
          `✅ Unlimited access\n` +
          `✅ No ads\n` +
          `✅ HD quality\n` +
          `✅ Early access to new content`,
        keyboard,
      );
    } else {
      await ctx.reply(
        `💎 VIP Subscription\n\n` +
          `🎁 Get VIP access and enjoy:\n` +
          `✅ Unlimited movies & series\n` +
          `✅ Ad-free experience\n` +
          `✅ HD quality\n` +
          `✅ Early access to new content\n\n` +
          `💰 Plans:\n` +
          `📍 1 Month - 50,000 UZS\n` +
          `📍 3 Months - 120,000 UZS (Save 20%)\n` +
          `📍 1 Year - 400,000 UZS (Save 33%)\n\n` +
          `🔥 Subscribe now!`,
        keyboard,
      );
    }
  }

  async handleHelp(ctx: any) {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('💎 VIP Info', 'vip_info')],
      [Markup.button.url('📞 Support', 't.me/manyaktv_support')],
      [Markup.button.callback('« Back', 'back_to_start')],
    ]);

    await ctx.reply(
      `ℹ️ MANYAK TV - Help\n\n` +
        `📱 How to use:\n` +
        `1️⃣ Click "Open MANYAK TV" button\n` +
        `2️⃣ Browse movies & series\n` +
        `3️⃣ Watch instantly!\n\n` +
        `💎 VIP Subscription:\n` +
        `Get unlimited access to all content\n\n` +
        `📞 Support:\n` +
        `If you have any questions, contact @manyaktv_support\n\n` +
        `🎬 Enjoy!`,
      keyboard,
    );
  }

  async handleCallback(ctx: any) {
    const callbackData = ctx.callbackQuery.data;

    await ctx.answerCbQuery();

    switch (callbackData) {
      case 'vip_info':
        await this.handleVip(ctx);
        break;

      case 'subscribe_vip':
        await this.handleSubscribeVip(ctx);
        break;

      case 'help':
        await this.handleHelp(ctx);
        break;

      case 'back_to_start':
        await this.handleStart(ctx);
        break;

      default:
        await ctx.reply('Unknown command');
    }
  }

  private async handleSubscribeVip(ctx: any) {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📍 1 Month - 50K', 'plan_1month')],
      [Markup.button.callback('📍 3 Months - 120K', 'plan_3months')],
      [Markup.button.callback('📍 1 Year - 400K', 'plan_1year')],
      [Markup.button.callback('« Back', 'vip_info')],
    ]);

    await ctx.reply(
      `💳 Choose your VIP plan:\n\n` +
        `📍 1 Month - 50,000 UZS\n` +
        `📍 3 Months - 120,000 UZS (Save 20%)\n` +
        `📍 1 Year - 400,000 UZS (Save 33%)\n\n` +
        `After selecting, you'll receive payment instructions.`,
      keyboard,
    );
  }
}
