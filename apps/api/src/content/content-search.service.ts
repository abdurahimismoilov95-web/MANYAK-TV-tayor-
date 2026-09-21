import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentType } from '@prisma/client';

interface SearchOptions {
  query?: string;
  type?: ContentType;
  categoryId?: string;
  isFree?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class ContentSearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Advanced content search with filters
   */
  async search(options: SearchOptions) {
    const {
      query,
      type,
      categoryId,
      isFree,
      page = 1,
      limit = 20,
    } = options;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (type) where.type = type;
    if (categoryId) {
      where.categories = { some: { categoryId } };
    }
    if (isFree !== undefined) where.isFree = isFree;

    const [contents, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        skip,
        take: limit,
        include: { categories: { include: { category: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.content.count({ where }),
    ]);

    return {
      contents,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get trending content
   */
  async getTrending(limit = 10) {
    return this.prisma.content.findMany({
      take: limit,
      orderBy: { views: 'desc' },
      where: { isFeatured: true },
    });
  }

  /**
   * Get similar content
   */
  async getSimilar(contentId: string, limit = 5) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      include: { categories: true },
    });

    if (!content) return [];

    const categoryIds = content.categories.map((c) => c.categoryId);

    return this.prisma.content.findMany({
      where: {
        id: { not: contentId },
        categories: { some: { categoryId: { in: categoryIds } } },
      },
      take: limit,
      orderBy: { views: 'desc' },
    });
  }
}
