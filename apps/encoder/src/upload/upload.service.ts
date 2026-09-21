import { Injectable } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UploadService {
  private uploadDir = process.env.UPLOAD_DIR || './uploads';
  private videoDir = path.join(this.uploadDir, 'videos');
  private imageDir = path.join(this.uploadDir, 'images');

  constructor(private prisma: PrismaService) {
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    await fs.ensureDir(this.videoDir);
    await fs.ensureDir(this.imageDir);
  }

  /**
   * Save uploaded video file
   */
  async saveVideo(file: Express.Multer.File, contentId: string): Promise<string> {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${contentId}_${timestamp}${ext}`;
    const filepath = path.join(this.videoDir, filename);

    await fs.writeFile(filepath, file.buffer);

    return filepath;
  }

  /**
   * Save uploaded image file
   */
  async saveImage(file: Express.Multer.File, contentId: string): Promise<string> {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${contentId}_${timestamp}${ext}`;
    const filepath = path.join(this.imageDir, filename);

    await fs.writeFile(filepath, file.buffer);

    return filepath;
  }

  /**
   * Get file size
   */
  async getFileSize(filepath: string): Promise<number> {
    const stats = await fs.stat(filepath);
    return stats.size;
  }

  /**
   * Delete file
   */
  async deleteFile(filepath: string): Promise<void> {
    await fs.remove(filepath);
  }

  /**
   * Get disk usage
   */
  async getDiskUsage(): Promise<{ total: number; used: number; free: number }> {
    // This is a simplified version - in production use a proper disk usage library
    const files = await fs.readdir(this.uploadDir, { withFileTypes: true });
    let totalSize = 0;

    for (const file of files) {
      if (file.isFile()) {
        const filepath = path.join(this.uploadDir, file.name);
        const stats = await fs.stat(filepath);
        totalSize += stats.size;
      }
    }

    return {
      total: 0, // Would need OS-level call
      used: totalSize,
      free: 0, // Would need OS-level call
    };
  }
}
