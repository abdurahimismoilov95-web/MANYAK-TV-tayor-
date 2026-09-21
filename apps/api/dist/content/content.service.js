"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ContentService = class ContentService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createContentDto) {
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
    async findAll(filters) {
        const { type, categoryId, isPremium, isPublished = true, search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', } = filters;
        const skip = (page - 1) * limit;
        const where = { isPublished };
        if (type)
            where.type = type;
        if (isPremium !== undefined)
            where.isPremium = isPremium;
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
    async findOne(id, userId) {
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
            throw new common_1.NotFoundException('Content not found');
        }
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
    async update(id, updateContentDto) {
        const { categories, ...contentData } = updateContentDto;
        const content = await this.prisma.content.findUnique({ where: { id } });
        if (!content) {
            throw new common_1.NotFoundException('Content not found');
        }
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
    async remove(id) {
        const content = await this.prisma.content.findUnique({ where: { id } });
        if (!content) {
            throw new common_1.NotFoundException('Content not found');
        }
        return this.prisma.content.delete({ where: { id } });
    }
    async togglePublish(id) {
        const content = await this.prisma.content.findUnique({ where: { id } });
        if (!content) {
            throw new common_1.NotFoundException('Content not found');
        }
        return this.prisma.content.update({
            where: { id },
            data: {
                isPublished: !content.isPublished,
                publishedAt: !content.isPublished ? new Date() : null,
            },
        });
    }
    async incrementViews(id) {
        return this.prisma.content.update({
            where: { id },
            data: {
                viewsCount: { increment: 1 },
            },
        });
    }
    async getTrending(limit = 10) {
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
    async getRecentlyAdded(limit = 20) {
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
    async getStats() {
        const [totalContent, movies, series, shorts, premiumContent, totalViews,] = await Promise.all([
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
    async search(query, limit = 20) {
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
};
exports.ContentService = ContentService;
exports.ContentService = ContentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContentService);
//# sourceMappingURL=content.service.js.map