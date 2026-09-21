import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { EncoderService } from './encoder/encoder.service';
import { EncoderController } from './encoder/encoder.controller';
import { EncoderProcessor } from './encoder/encoder.processor';
import { UploadService } from './upload/upload.service';
import { UploadController } from './upload/upload.controller';
import { ThumbnailService } from './thumbnail/thumbnail.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    BullModule.registerQueue({
      name: 'video-encoding',
    }),
  ],
  controllers: [EncoderController, UploadController],
  providers: [
    EncoderService,
    EncoderProcessor,
    UploadService,
    ThumbnailService,
    PrismaService,
  ],
})
export class AppModule {}
