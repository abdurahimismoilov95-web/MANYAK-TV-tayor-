import { Injectable } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs-extra';

@Injectable()
export class ThumbnailService {
  /**
   * Generate thumbnail from video at specific timestamp
   */
  async generateFromVideo(
    videoPath: string,
    outputPath: string,
    timestamp: string = '00:00:05',
  ): Promise<void> {
    await fs.ensureDir(path.dirname(outputPath));

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timestamp],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '1280x720',
        })
        .on('end', () => {
          console.log(`Thumbnail generated: ${outputPath}`);
          resolve();
        })
        .on('error', (err) => {
          console.error('Thumbnail generation error:', err);
          reject(err);
        });
    });
  }

  /**
   * Generate multiple thumbnails (sprite sheet)
   */
  async generateSpriteSheet(
    videoPath: string,
    outputDir: string,
    count: number = 12,
  ): Promise<string[]> {
    await fs.ensureDir(outputDir);

    // Get video duration
    const metadata: any = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const duration = metadata.format.duration;
    const interval = duration / count;
    const timestamps: string[] = [];

    for (let i = 1; i <= count; i++) {
      const time = interval * i;
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      timestamps.push(`00:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }

    const outputPaths: string[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const outputPath = path.join(outputDir, `thumb_${i + 1}.jpg`);
      await this.generateFromVideo(videoPath, outputPath, timestamps[i]);
      outputPaths.push(outputPath);
    }

    return outputPaths;
  }

  /**
   * Optimize/resize image using Sharp
   */
  async optimizeImage(
    inputPath: string,
    outputPath: string,
    width: number = 1280,
    quality: number = 80,
  ): Promise<void> {
    await sharp(inputPath)
      .resize(width, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality })
      .toFile(outputPath);
  }

  /**
   * Generate multiple sizes of thumbnail
   */
  async generateMultipleSizes(
    inputPath: string,
    outputDir: string,
  ): Promise<Record<string, string>> {
    await fs.ensureDir(outputDir);

    const sizes = {
      small: 320,
      medium: 640,
      large: 1280,
    };

    const outputs: Record<string, string> = {};

    for (const [key, width] of Object.entries(sizes)) {
      const outputPath = path.join(outputDir, `thumbnail_${key}.jpg`);
      await this.optimizeImage(inputPath, outputPath, width);
      outputs[key] = outputPath;
    }

    return outputs;
  }

  /**
   * Generate poster image (for video player)
   */
  async generatePoster(
    videoPath: string,
    outputPath: string,
  ): Promise<void> {
    // Generate at 10% of video duration
    await this.generateFromVideo(videoPath, outputPath, '10%');
    
    // Optimize
    await this.optimizeImage(outputPath, outputPath, 1920, 85);
  }
}
