import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VerificationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate 6-digit verification code
   */
  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create verification code for user
   */
  async createVerification(telegramId: string, phoneNumber: string) {
    const code = this.generateCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    return this.prisma.verification.create({
      data: {
        telegramId,
        phoneNumber,
        code,
        expiresAt,
        isVerified: false,
      },
    });
  }

  /**
   * Verify code
   */
  async verifyCode(telegramId: string, code: string) {
    const verification = await this.prisma.verification.findFirst({
      where: {
        telegramId,
        code,
        isVerified: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verification) {
      return { success: false, message: 'Invalid or expired code' };
    }

    // Mark as verified
    await this.prisma.verification.update({
      where: { id: verification.id },
      data: { isVerified: true },
    });

    // Update user phone number
    await this.prisma.user.update({
      where: { telegramId },
      data: { phoneNumber: verification.phoneNumber },
    });

    return { success: true, message: 'Phone verified successfully' };
  }

  /**
   * Clean expired verifications (scheduled task)
   */
  async cleanExpiredVerifications() {
    const result = await this.prisma.verification.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return result.count;
  }
}
