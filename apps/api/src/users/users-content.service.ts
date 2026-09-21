import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * User Content Service - Favorites & Watch History
 * Responsibilities: User interactions with content
 * Max 150 lines - Single Responsibility Principle
 */
@Injectable()
export class UsersContentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Add content to favorites
   */
  async addFavorite(userId: string, contentId: string) {
    // Check if already favorited
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_contentId: { userId, contentId },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.favorite.create({
      data: { userId, contentId },
      include: { content: true },
    });
  }

  /**
   * Remove content from favorites
   */
  async removeFavorite(userId: string, contentId: string) {
    return this.prisma.favorite.delete({
      where: {
        userId_contentId: { userId, contentId },
      },
    });
  }

  /**
   * Get user's favorites
   */
  async getFavorites(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        skip,
        take: limit,
        include: { content: true },
        orderBy: { addedAt: 'desc' },
      }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);

    return {
      favorites: favorites.map((f: any) => f.content),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Add to watch history
   */
  async addToHistory(
    userId: string,
    contentId: string,
    watchedAt?: Date,
    progressSeconds?: number,
  ) {
    // Check if already exists
    const existing = await this.prisma.watchHistory.findUnique({
      where: {
        id: `${userId}_${contentId}`,  // Use single unique field instead of composite
      },
    });

    if (existing) {
      // Update
      return this.prisma.watchHistory.update({
        where: { id: existing.id },
        data: {
          watchedAt: watchedAt || new Date(),
          progressSeconds: progressSeconds || 0,
        },
      });
    }

    // Create new
    return this.prisma.watchHistory.create({
      data: {
        userId,
        contentId,
        watchedAt: watchedAt || new Date(),
        progressSeconds: progressSeconds || 0,
        totalSeconds: 0,
      },
    });
  }

  /**
   * Get watch history
   */
  async getHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      this.prisma.watchHistory.findMany({
        where: { userId },
        skip,
        take: limit,
        include: { content: true },
        orderBy: { watchedAt: 'desc' },
      }),
      this.prisma.watchHistory.count({ where: { userId } }),
    ]);

    return { history, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Clear watch history
   */
  async clearHistory(userId: string) {
    return this.prisma.watchHistory.deleteMany({
      where: { userId },
    });
  }

  /**
   * Get watching progress for a content
   */
  async getProgress(userId: string, contentId: string) {
    const history = await this.prisma.watchHistory.findUnique({
      where: {
        id: `${userId}_${contentId}`,
      },
    });

    return history?.progressSeconds || 0;
  }

  /**
   * Check if user has purchased content
   */
  async hasPurchased(userId: string, contentId: string) {
    const purchase = await this.prisma.userContent.findUnique({
      where: {
        userId_contentId: { userId, contentId },
      },
    });

    return !!purchase;
  }

  /**
   * Get user's purchased content
   */
  async getPurchasedContent(userId: string) {
    const purchases = await this.prisma.userContent.findMany({
      where: { userId },
      include: { content: true },
    });

    return purchases.map((p: any) => p.content);
  }
}
