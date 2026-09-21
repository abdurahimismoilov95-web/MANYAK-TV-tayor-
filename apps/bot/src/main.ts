import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.BOT_PORT || 3001;
  await app.listen(port);

  console.log(`🤖 Bot Service running on: http://localhost:${port}`);
  console.log(`📱 Telegram Bot started`);
}

bootstrap();
