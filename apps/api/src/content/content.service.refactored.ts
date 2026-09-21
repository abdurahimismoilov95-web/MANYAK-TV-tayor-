import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentType } from '@prisma/client';

interface CreateContentDto {
  title: string;
  description?: string;
  type: ContentType;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  releaseYear?: number;
  rating?: number;
  isFree?: boolean;
  isPremium?: boolean;
  isFeatured?: boolean;
  categories?: string[];
}

interface UpdateContentDto {
  title?: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  releaseYear?: number;
  rating?: number;
  isFree?: boolean;
  isPremium?: boolean;
  isFeatured?: boolean;
}

/**
 * Content Service - CRUD operations only
 * Responsibilities: Create, Read, Update, Delete
 * Max 200 lines - Single Responsibility Principle
 */
@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create new content (admin only)
   */
  async create(data: CreateContentDto) {
    const { categories, ...contentData } = data;

    const content = await this.prisma.content.create({
      data: {
        ...contentData,
        categories: categories
          ? {
              create: categories.map((categoryId) => ({
                category: { connect: { id: categoryId } },
              })),
            }
          : undefined,
      },
      include: { categories: { include: { category: true } } },
    });

    return content;
  }

  /**
   * Get all content with pagination
   */
  async findAll(page = 1, limit = 20, type?: ContentType) {
    const skip = (page - 1) * limit;
    const where = type ? { type } : {};

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
   * Get single content by ID
   */
  async findOne(id: string) {
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        categories: { include: { category: true } },
        episodes: { orderBy: { episodeNumber: 'asc' } },
      },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return content;
  }

  /**
   * Update content
   */
  async update(id: string, data: UpdateContentDto) {
    await this.findOne(id); // Check existence

    return this.prisma.content.update({
      where: { id },
      data,
      include: { categories: { include: { category: true } } },
    });
  }

  /**
   * Delete content
   */
  async remove(id: string) {
    await this.findOne(id); // Check existence

    return this.prisma.content.delete({
      where: { id },
    });
  }

  /**
   * Get featured content
   */
  async getFeatured(limit = 5) {
    return this.prisma.content.findMany({
      where: { isFeatured: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get free content
   */
  async getFreeContent(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [contents, total] = await Promise.all([
      this.prisma.content.findMany({
        where: { isFree: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.content.count({ where: { isFree: true } }),
    ]);

    return { contents, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get premium content
   */
  async getPremiumContent(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [contents, total] = await Promise.all([
      this.prisma.content.findMany({
        where: { isPremium: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.content.count({ where: { isPremium: true } }),
    ]);

    return { contents, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get content by category
   */
  async getByCategory(categoryId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [contents, total] = await Promise.all([
      this.prisma.content.findMany({
        where: {
          categories: { some: { categoryId } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.content.count({
        where: { categories: { some: { categoryId } } },
      }),
    ]);

    return { contents, total, page, totalPages: Math.ceil(total / limit) };
  }
}
