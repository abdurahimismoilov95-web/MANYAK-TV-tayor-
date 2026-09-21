import { Controller, Post, Body, Get } from '@nestjs/common';
import { BotService } from '../bot/bot.service';
import { BroadcastService } from '../broadcast/broadcast.service';
import { VerificationService } from '../verification/verification.service';

@Controller('webhook')
export class WebhookController {
  constructor(
    private botService: BotService,
    private broadcastService: BroadcastService,
    private verificationService: VerificationService,
  ) {}

  /**
   * Telegram webhook endpoint
   */
  @Post('telegram')
  async handleTelegramWebhook(@Body() update: any) {
    try {
      await this.botService.getBot().handleUpdate(update);
      return { ok: true };
    } catch (error) {
      console.error('Webhook error:', error);
      return { ok: false, error: error.message };
    }
  }

  /**
   * Send broadcast (admin only)
   */
  @Post('broadcast')
  async sendBroadcast(@Body() body: any) {
    return this.broadcastService.sendBroadcast(body);
  }

  /**
   * Get broadcast history
   */
  @Get('broadcast/history')
  async getBroadcastHistory() {
    return this.broadcastService.getBroadcastHistory();
  }

  /**
   * Create verification code
   */
  @Post('verification/create')
  async createVerification(@Body() body: { telegramId: string; phoneNumber: string }) {
    return this.verificationService.createVerification(
      body.telegramId,
      body.phoneNumber,
    );
  }

  /**
   * Verify code
   */
  @Post('verification/verify')
  async verifyCode(@Body() body: { telegramId: string; code: string }) {
    return this.verificationService.verifyCode(body.telegramId, body.code);
  }

  /**
   * Health check
   */
  @Get('health')
  async health() {
    return { status: 'ok', service: 'bot', timestamp: new Date() };
  }
}
