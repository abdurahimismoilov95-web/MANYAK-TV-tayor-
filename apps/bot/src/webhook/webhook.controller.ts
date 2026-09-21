import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { BotService } from '../bot/bot.service';
import { BroadcastService } from '../broadcast/broadcast.service';
import { VerificationService } from '../verification/verification.service';
import { BroadcastDto, CreateVerificationDto, VerifyCodeDto } from './dto';

@ApiTags('Webhook')
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
  @ApiOperation({ summary: 'Handle Telegram webhook updates' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
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
  @ApiOperation({ summary: 'Create broadcast message' })
  @ApiBody({ type: BroadcastDto })
  @ApiResponse({ status: 201, description: 'Broadcast created successfully' })
  async sendBroadcast(@Body() body: BroadcastDto) {
    return this.broadcastService.sendBroadcast(body);
  }

  /**
   * Get broadcast history
   */
  @Get('broadcast/history')
  @ApiOperation({ summary: 'Get broadcast history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Broadcast history retrieved' })
  async getBroadcastHistory(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return this.broadcastService.getBroadcastHistory(pageNum, limitNum);
  }

  /**
   * Create verification code
   */
  @Post('verification/create')
  @ApiOperation({ summary: 'Create phone verification' })
  @ApiBody({ type: CreateVerificationDto })
  @ApiResponse({ status: 201, description: 'Verification created' })
  async createVerification(@Body() body: CreateVerificationDto) {
    return this.verificationService.createVerification(
      body.telegramId,
      body.phoneNumber,
    );
  }

  /**
   * Verify code
   */
  @Post('verification/verify')
  @ApiOperation({ summary: 'Verify phone code' })
  @ApiBody({ type: VerifyCodeDto })
  @ApiResponse({ status: 200, description: 'Code verified' })
  async verifyCode(@Body() body: VerifyCodeDto) {
    return this.verificationService.verifyCode(body.telegramId, body.code);
  }

  /**
   * Health check
   */
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async health() {
    return { status: 'ok', service: 'bot', timestamp: new Date() };
  }
}
