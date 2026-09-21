import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { EncoderService } from './encoder.service';
import { ThumbnailService } from '../thumbnail/thumbnail.service';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';

@Processor('video-encoding')
export class EncoderProcessor {
  constructor(
    private encoderService: EncoderService,
    private thumbnailService: ThumbnailService,
    private prisma: PrismaService,
  ) {}

  @Process('encode-video')
  async handleEncoding(job: Job) {
    const { contentId, inputPath, outputDir, qualities } = job.data;

    try {
      console.log(`Starting encoding job ${job.id} for content ${contentId}`);

      // Update progress: Getting metadata
      await job.progress(10);
      const metadata = await this.encoderService.getVideoMetadata(inputPath);
      const duration = metadata.format.duration;

      console.log(`Video duration: ${duration}s`);

      // Update progress: Generating thumbnail
      await job.progress(20);
      const thumbnailPath = path.join(outputDir, 'thumbnail.jpg');
      await this.thumbnailService.generateFromVideo(inputPath, thumbnailPath);

      // Update progress: Encoding to HLS
      await job.progress(30);
      await this.encoderService.encodeToHLS(inputPath, outputDir, qualities);

      // Update progress: Generating preview
      await job.progress(90);
      const previewPath = path.join(outputDir, 'preview.mp4');
      await this.encoderService.generatePreview(inputPath, previewPath, 30);

      // Update content in database
      await job.progress(95);
      await this.prisma.content.update({
        where: { id: contentId },
        data: {
          processingStatus: 'COMPLETED',
          videoUrl: `${outputDir}/master.m3u8`,
          thumbnailUrl: thumbnailPath,
          duration: Math.floor(duration),
          availableQualities: qualities,
        },
      });

      await job.progress(100);
      console.log(`Encoding job ${job.id} completed successfully`);

      return {
        success: true,
        contentId,
        outputDir,
        duration,
      };
    } catch (error) {
      console.error(`Encoding job ${job.id} failed:`, error);

      // Mark as failed in database
      await this.prisma.content.update({
        where: { id: contentId },
        data: { processingStatus: 'FAILED' },
      });

      throw error;
    }
  }
}
