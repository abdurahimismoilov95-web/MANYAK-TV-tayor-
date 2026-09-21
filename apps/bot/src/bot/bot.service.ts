import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Markup } from 'telegraf';
import { CommandsService } from '../commands/commands.service';

@Injectable()
export class BotService implements OnModuleInit {
  private bot: Telegraf;

  constructor(
    private config: ConfigService,
    private commandsService: CommandsService,
  ) {
    const token = this.config.get('TELEGRAM_BOT_TOKEN');
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not defined');
    }
    this.bot = new Telegraf(token);
  }

  async onModuleInit() {
    await this.setupCommands();
    await this.setupHandlers();
    await this.launch();
  }

  private async setupCommands() {
    await this.bot.telegram.setMyCommands([
      { command: 'start', description: 'Start the bot & open web app' },
      { command: 'vip', description: 'VIP subscription info' },
      { command: 'help', description: 'Get help' },
    ]);
  }

  private async setupHandlers() {
    // /start command
    this.bot.command('start', async (ctx) => {
      await this.commandsService.handleStart(ctx);
    });

    // /vip command
    this.bot.command('vip', async (ctx) => {
      await this.commandsService.handleVip(ctx);
    });

    // /help command
    this.bot.command('help', async (ctx) => {
      await this.commandsService.handleHelp(ctx);
    });

    // Callback queries (inline buttons)
    this.bot.on('callback_query', async (ctx) => {
      await this.commandsService.handleCallback(ctx);
    });

    // Messages
    this.bot.on('message', async (ctx) => {
      // Auto-reply for unknown messages
      await ctx.reply('Please use commands or buttons to interact with the bot.');
    });
  }

  private async launch() {
    const webhookUrl = this.config.get('WEBHOOK_URL');
    
    if (webhookUrl) {
      // Production: webhook mode
      await this.bot.telegram.setWebhook(webhookUrl);
      console.log(`✅ Webhook set: ${webhookUrl}`);
    } else {
      // Development: polling mode
      await this.bot.launch();
      console.log('✅ Bot started in polling mode');
    }

    // Graceful shutdown
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }

  getBot() {
    return this.bot;
  }

  async sendMessage(chatId: number, text: string, extra?: any) {
    return this.bot.telegram.sendMessage(chatId, text, extra);
  }
}
