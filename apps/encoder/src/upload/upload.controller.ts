import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { EncoderService } from '../encoder/encoder.service';
import { ThumbnailService } from '../thumbnail/thumbnail.service';

@Controller('upload')
export class UploadController {
  constructor(
    private uploadService: UploadService,
    private encoderService: EncoderService,
    private thumbnailService: ThumbnailService,
  ) {}

  /**
   * Upload video and start encoding
   */
  @Post('video')
  @UseInterceptors(FileInterceptor('video'))
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { contentId: string; qualities?: string[] },
  ) {
    // Save uploaded file
    const filepath = await this.uploadService.saveVideo(file, body.contentId);

    // Get file info
    const fileSize = await this.uploadService.getFileSize(filepath);
    const metadata = await this.encoderService.getVideoMetadata(filepath);

    // Start encoding job
    const outputDir = filepath.replace(/\.[^/.]+$/, '_hls');
    const job = await this.encoderService.addToQueue({
      contentId: body.contentId,
      inputPath: filepath,
      outputDir,
      qualities: body.qualities || ['720p', '480p', '360p'],
    });

    return {
      success: true,
      filepath,
      fileSize,
      duration: metadata.format.duration,
      job,
    };
  }

  /**
   * Upload image (poster/thumbnail)
   */
  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { contentId: string },
  ) {
    const filepath = await this.uploadService.saveImage(file, body.contentId);

    // Generate multiple sizes
    const outputDir = filepath.replace(/\.[^/.]+$/, '_sizes');
    const sizes = await this.thumbnailService.generateMultipleSizes(
      filepath,
      outputDir,
    );

    return {
      success: true,
      original: filepath,
      sizes,
    };
  }

  /**
   * Get disk usage stats
   */
  @Get('stats')
  async getStats() {
    return this.uploadService.getDiskUsage();
  }

  /**
   * Health check
   */
  @Get('health')
  async health() {
    return { status: 'ok', service: 'upload', timestamp: new Date() };
  }
}
