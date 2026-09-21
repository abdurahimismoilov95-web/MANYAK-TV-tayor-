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
    async create(data) {
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
    async findAll(page = 1, limit = 20, type) {
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
    async findOne(id) {
        const content = await this.prisma.content.findUnique({
            where: { id },
            include: {
                categories: { include: { category: true } },
                episodes: { orderBy: { episodeNumber: 'asc' } },
            },
        });
        if (!content) {
            throw new common_1.NotFoundException('Content not found');
        }
        return content;
    }
    async update(id, data) {
        await this.findOne(id);
        return this.prisma.content.update({
            where: { id },
            data,
            include: { categories: { include: { category: true } } },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.content.delete({
            where: { id },
        });
    }
    async getFeatured(limit = 5) {
        return this.prisma.content.findMany({
            where: { isFeatured: true },
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
    }
    async getFreeContent(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [contents, total] = await Promise.all([
            this.prisma.content.findMany({
                where: { isPremium: false },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.content.count({ where: { isPremium: false } }),
        ]);
        return { contents, total, page, totalPages: Math.ceil(total / limit) };
    }
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
    async getByCategory(categoryId, page = 1, limit = 20) {
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
};
exports.ContentService = ContentService;
exports.ContentService = ContentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContentService);
//# sourceMappingURL=content.service.refactored.js.map