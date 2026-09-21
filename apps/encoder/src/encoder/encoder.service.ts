import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs-extra';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

interface EncodeJobData {
  contentId: string;
  inputPath: string;
  outputDir: string;
  qualities: string[];
}

@Injectable()
export class EncoderService {
  constructor(
    @InjectQueue('video-encoding') private encodingQueue: Queue,
    private prisma: PrismaService,
  ) {}

  /**
   * Add video to encoding queue
   */
  async addToQueue(data: EncodeJobData) {
    const job = await this.encodingQueue.add('encode-video', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });

    // Update content status
    await this.prisma.content.update({
      where: { id: data.contentId },
      data: { processingStatus: 'PROCESSING' },
    });

    return {
      jobId: job.id,
      status: 'queued',
      contentId: data.contentId,
    };
  }

  /**
   * Get video metadata using FFprobe
   */
  async getVideoMetadata(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata);
      });
    });
  }

  /**
   * Encode video to HLS with multiple qualities
   */
  async encodeToHLS(
    inputPath: string,
    outputDir: string,
    qualities: string[] = ['720p', '480p', '360p'],
  ): Promise<void> {
    await fs.ensureDir(outputDir);

    const qualitySettings = {
      '1080p': { width: 1920, height: 1080, bitrate: '5000k', audioBitrate: '192k' },
      '720p': { width: 1280, height: 720, bitrate: '2800k', audioBitrate: '128k' },
      '480p': { width: 854, height: 480, bitrate: '1400k', audioBitrate: '128k' },
      '360p': { width: 640, height: 360, bitrate: '800k', audioBitrate: '96k' },
    };

    // Create master playlist
    const masterPlaylist: string[] = ['#EXTM3U', '#EXT-X-VERSION:3'];

    // Encode each quality
    for (const quality of qualities) {
      const settings = qualitySettings[quality];
      if (!settings) continue;

      const qualityDir = path.join(outputDir, quality);
      await fs.ensureDir(qualityDir);

      const playlistPath = path.join(qualityDir, 'playlist.m3u8');

      await this.encodeQuality(inputPath, qualityDir, settings);

      // Add to master playlist
      const bandwidth = parseInt(settings.bitrate) * 1000;
      masterPlaylist.push(
        `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${settings.width}x${settings.height}`,
        `${quality}/playlist.m3u8`,
      );
    }

    // Write master playlist
    const masterPath = path.join(outputDir, 'master.m3u8');
    await fs.writeFile(masterPath, masterPlaylist.join('\n'));
  }

  /**
   * Encode single quality variant
   */
  private encodeQuality(
    inputPath: string,
    outputDir: string,
    settings: any,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(outputDir, 'segment_%03d.ts');
      const playlistPath = path.join(outputDir, 'playlist.m3u8');

      ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',
          '-c:a aac',
          `-b:v ${settings.bitrate}`,
          `-b:a ${settings.audioBitrate}`,
          `-vf scale=${settings.width}:${settings.height}`,
          '-preset fast',
          '-profile:v main',
          '-level 4.0',
          '-start_number 0',
          '-hls_time 6',
          '-hls_list_size 0',
          `-hls_segment_filename ${outputPath}`,
          '-f hls',
        ])
        .output(playlistPath)
        .on('start', (cmd) => {
          console.log(`FFmpeg command: ${cmd}`);
        })
        .on('progress', (progress) => {
          console.log(`Processing ${settings.width}x${settings.height}: ${progress.percent}%`);
        })
        .on('end', () => {
          console.log(`Finished encoding ${settings.width}x${settings.height}`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`Error encoding ${settings.width}x${settings.height}:`, err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Generate preview/trailer clip
   */
  async generatePreview(
    inputPath: string,
    outputPath: string,
    duration: number = 30,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(60) // Start from 1 minute
        .setDuration(duration)
        .outputOptions([
          '-c:v libx264',
          '-c:a aac',
          '-b:v 1000k',
          '-b:a 128k',
          '-preset fast',
        ])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  /**
   * Extract audio track
   */
  async extractAudio(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions(['-vn', '-c:a libmp3lame', '-b:a 192k'])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string) {
    const job = await this.encodingQueue.getJob(jobId);
    if (!job) {
      return { error: 'Job not found' };
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
      jobId: job.id,
      state,
      progress,
      data: job.data,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
    };
  }

  /**
   * Clean up old files
   */
  async cleanupFiles(directory: string, olderThanDays: number = 30) {
    const files = await fs.readdir(directory);
    const now = Date.now();
    const maxAge = olderThanDays * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtimeMs > maxAge) {
        await fs.remove(filePath);
        console.log(`Cleaned up old file: ${filePath}`);
      }
    }
  }
}
