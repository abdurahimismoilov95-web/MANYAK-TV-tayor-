import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotService } from './bot/bot.service';
import { WebhookController } from './webhook/webhook.controller';
import { CommandsService } from './commands/commands.service';
import { VerificationService } from './verification/verification.service';
import { BroadcastService } from './broadcast/broadcast.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [WebhookController],
  providers: [
    BotService,
    CommandsService,
    VerificationService,
    BroadcastService,
    PrismaService,
  ],
})
export class AppModule {}
