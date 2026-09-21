import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContentStatsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Increment view count
   */
  async incrementViews(contentId: string) {
    return this.prisma.content.update({
      where: { id: contentId },
      data: { views: { increment: 1 } },
    });
  }

  /**
   * Get content statistics
   */
  async getStats() {
    const [
      totalContent,
      movies,
      series,
      totalViews,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.content.count(),
      this.prisma.content.count({ where: { type: 'MOVIE' } }),
      this.prisma.content.count({ where: { type: 'SERIES' } }),
      this.prisma.content.aggregate({
        _sum: { views: true },
      }),
      this.prisma.content.aggregate({
        _sum: { revenue: true },
      }),
    ]);

    return {
      totalContent,
      movies,
      series,
      totalViews: totalViews._sum.views || 0,
      totalRevenue: totalRevenue._sum.revenue || 0,
    };
  }

  /**
   * Get top viewed content
   */
  async getTopViewed(limit = 10) {
    return this.prisma.content.findMany({
      take: limit,
      orderBy: { views: 'desc' },
      select: {
        id: true,
        title: true,
        views: true,
        type: true,
      },
    });
  }

  /**
   * Get revenue by content
   */
  async getRevenueStats() {
    return this.prisma.content.findMany({
      where: { revenue: { gt: 0 } },
      orderBy: { revenue: 'desc' },
      select: {
        id: true,
        title: true,
        revenue: true,
      },
      take: 20,
    });
  }
}
