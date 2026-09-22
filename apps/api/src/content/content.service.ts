import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto, UpdateContentDto, ContentFilterDto } from './dto';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create new content (admin only)
   */
  async create(createContentDto: CreateContentDto) {
    const { categories, ...contentData } = createContentDto;

    const content = await this.prisma.content.create({
      data: {
        ...contentData,
        categories: categories
          ? {
              create: categories.map((catId) => ({
                category: { connect: { id: catId } },
              })),
            }
          : undefined,
      },
      include: {
        categories: {
          include: { category: true },
        },
        episodes: true,
      },
    });

    return content;
  }

  /**
   * Get all content with filters
   */
  async findAll(filters: ContentFilterDto) {
    const {
      type,
      categoryId,
      isPremium,
      isPublished = true,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = { isPublished };

    if (type) where.type = type;
    if (isPremium !== undefined) where.isPremium = isPremium;
    
    if (categoryId) {
      where.categories = {
        some: { categoryId },
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [content, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          categories: {
            include: { category: true },
          },
          episodes: {
            select: {
              id: true,
              episodeNumber: true,
              seasonNumber: true,
              title: true,
            },
            orderBy: [
              { seasonNumber: 'asc' },
              { episodeNumber: 'asc' },
            ],
          },
          _count: {
            select: {
              watchHistory: true,
              favorites: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.content.count({ where }),
    ]);

    return {
      content,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get content by ID
   */
  async findOne(id: string, userId?: string) {
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        categories: {
          include: { category: true },
        },
        episodes: {
          orderBy: [
            { seasonNumber: 'asc' },
            { episodeNumber: 'asc' },
          ],
        },
        _count: {
          select: {
            watchHistory: true,
            favorites: true,
            comments: true,
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Check if user has access
    let hasAccess = content.isPublished && !content.isPremium;
    let isFavorite = false;
    let watchProgress = null;

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          favorites: { where: { contentId: id } },
          watchHistory: {
            where: { contentId: id },
            orderBy: { watchedAt: 'desc' },
            take: 1,
          },
          purchasedContent: { where: { contentId: id } },
        },
      });

      if (user) {
        hasAccess =
          !content.isPremium ||
          user.isVip ||
          user.purchasedContent.length > 0;
        isFavorite = user.favorites.length > 0;
        watchProgress = user.watchHistory[0] || null;
      }
    }

    return {
      ...content,
      hasAccess,
      isFavorite,
      watchProgress,
    };
  }

  /**
   * Update content (admin only)
   */
  async update(id: string, updateContentDto: UpdateContentDto) {
    const { categories, ...contentData } = updateContentDto;

    const content = await this.prisma.content.findUnique({ where: { id } });
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Update categories if provided
    if (categories) {
      await this.prisma.contentCategory.deleteMany({
        where: { contentId: id },
      });
    }

    return this.prisma.content.update({
      where: { id },
      data: {
        ...contentData,
        categories: categories
          ? {
              create: categories.map((catId) => ({
                category: { connect: { id: catId } },
              })),
            }
          : undefined,
      },
      include: {
        categories: {
          include: { category: true },
        },
        episodes: true,
      },
    });
  }

  /**
   * Delete content (admin only)
   */
  async remove(id: string) {
    const content = await this.prisma.content.findUnique({ where: { id } });
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return this.prisma.content.delete({ where: { id } });
  }

  /**
   * Publish/unpublish content
   */
  async togglePublish(id: string) {
    const content = await this.prisma.content.findUnique({ where: { id } });
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return this.prisma.content.update({
      where: { id },
      data: {
        isPublished: !content.isPublished,
        publishedAt: !content.isPublished ? new Date() : null,
      },
    });
  }

  /**
   * Increment view count
   */
  async incrementViews(id: string) {
    return this.prisma.content.update({
      where: { id },
      data: {
        viewsCount: { increment: 1 },
      },
    });
  }

  /**
   * Get trending content
   */
  async getTrending(limit: number = 10) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.prisma.content.findMany({
      where: {
        isPublished: true,
        watchHistory: {
          some: {
            watchedAt: { gte: oneDayAgo },
          },
        },
      },
      take: limit,
      orderBy: { viewsCount: 'desc' },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });
  }

  /**
   * Get featured/hero content
   */
  async getFeatured() {
    return this.prisma.content.findMany({
      where: {
        isPublished: true,
        posterUrl: { not: null },
      },
      take: 5,
      orderBy: { viewsCount: 'desc' },
    });
  }

  /**
   * Get recently added
   */
  async getRecentlyAdded(limit: number = 20) {
    return this.prisma.content.findMany({
      where: { isPublished: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        categories: {
          include: { category: true },
        },
      },
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
      shorts,
      premiumContent,
      totalViews,
    ] = await Promise.all([
      this.prisma.content.count(),
      this.prisma.content.count({ where: { type: 'MOVIE' } }),
      this.prisma.content.count({ where: { type: 'SERIES' } }),
      this.prisma.content.count({ where: { type: 'SHORT' } }),
      this.prisma.content.count({ where: { isPremium: true } }),
      this.prisma.content.aggregate({
        _sum: { viewsCount: true },
      }),
    ]);

    return {
      totalContent,
      movies,
      series,
      shorts,
      premiumContent,
      totalViews: totalViews._sum.viewsCount || 0,
    };
  }

  /**
   * Search content with full-text search
   */
  async search(query: string, limit: number = 20) {
    return this.prisma.content.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { cast: { hasSome: [query] } },
          { director: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      include: {
        categories: {
          include: { category: true },
        },
      },
    });
  }
}

