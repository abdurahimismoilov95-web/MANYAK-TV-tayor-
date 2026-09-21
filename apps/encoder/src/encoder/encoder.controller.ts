import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { EncoderService } from './encoder.service';

@Controller('encoder')
export class EncoderController {
  constructor(private encoderService: EncoderService) {}

  /**
   * Add video to encoding queue
   */
  @Post('encode')
  async encodeVideo(@Body() body: any) {
    return this.encoderService.addToQueue(body);
  }

  /**
   * Get video metadata
   */
  @Post('metadata')
  async getMetadata(@Body() body: { filePath: string }) {
    return this.encoderService.getVideoMetadata(body.filePath);
  }

  /**
   * Get job status
   */
  @Get('job/:id')
  async getJobStatus(@Param('id') id: string) {
    return this.encoderService.getJobStatus(id);
  }

  /**
   * Generate preview clip
   */
  @Post('preview')
  async generatePreview(
    @Body() body: { inputPath: string; outputPath: string; duration?: number },
  ) {
    await this.encoderService.generatePreview(
      body.inputPath,
      body.outputPath,
      body.duration,
    );
    return { success: true, outputPath: body.outputPath };
  }

  /**
   * Extract audio
   */
  @Post('extract-audio')
  async extractAudio(@Body() body: { inputPath: string; outputPath: string }) {
    await this.encoderService.extractAudio(body.inputPath, body.outputPath);
    return { success: true, outputPath: body.outputPath };
  }

  /**
   * Health check
   */
  @Get('health')
  async health() {
    return { status: 'ok', service: 'encoder', timestamp: new Date() };
  }
}
