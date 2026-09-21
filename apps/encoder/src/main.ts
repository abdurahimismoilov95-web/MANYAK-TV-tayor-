import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  const port = process.env.ENCODER_PORT || 3002;
  await app.listen(port);

  console.log(`🎬 Encoder Service running on: http://localhost:${port}`);
  console.log(`📹 FFmpeg Video Processing Ready`);
  console.log(`🎞️  HLS Streaming Ready`);
}

bootstrap();
