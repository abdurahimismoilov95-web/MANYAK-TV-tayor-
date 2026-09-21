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
exports.ContentSearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ContentSearchService = class ContentSearchService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async search(options) {
        const { query, type, categoryId, isFree, page = 1, limit = 20, } = options;
        const skip = (page - 1) * limit;
        const where = {};
        if (query) {
            where.OR = [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
            ];
        }
        if (type)
            where.type = type;
        if (categoryId) {
            where.categories = { some: { categoryId } };
        }
        if (isFree !== undefined)
            where.isFree = isFree;
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
    async getTrending(limit = 10) {
        return this.prisma.content.findMany({
            take: limit,
            orderBy: { views: 'desc' },
            where: { isFeatured: true },
        });
    }
    async getSimilar(contentId, limit = 5) {
        const content = await this.prisma.content.findUnique({
            where: { id: contentId },
            include: { categories: true },
        });
        if (!content)
            return [];
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
};
exports.ContentSearchService = ContentSearchService;
exports.ContentSearchService = ContentSearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContentSearchService);
//# sourceMappingURL=content-search.service.js.map