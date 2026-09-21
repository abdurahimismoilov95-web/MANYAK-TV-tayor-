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
exports.UsersContentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersContentService = class UsersContentService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async addFavorite(userId, contentId) {
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
    async removeFavorite(userId, contentId) {
        return this.prisma.favorite.delete({
            where: {
                userId_contentId: { userId, contentId },
            },
        });
    }
    async getFavorites(userId, page = 1, limit = 20) {
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
            favorites: favorites.map((f) => f.content),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async addToHistory(userId, contentId, watchedAt, progressSeconds) {
        const existing = await this.prisma.watchHistory.findUnique({
            where: {
                id: `${userId}_${contentId}`,
            },
        });
        if (existing) {
            return this.prisma.watchHistory.update({
                where: { id: existing.id },
                data: {
                    watchedAt: watchedAt || new Date(),
                    progressSeconds: progressSeconds || 0,
                },
            });
        }
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
    async getHistory(userId, page = 1, limit = 20) {
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
    async clearHistory(userId) {
        return this.prisma.watchHistory.deleteMany({
            where: { userId },
        });
    }
    async getProgress(userId, contentId) {
        const history = await this.prisma.watchHistory.findUnique({
            where: {
                id: `${userId}_${contentId}`,
            },
        });
        return history?.progressSeconds || 0;
    }
    async hasPurchased(userId, contentId) {
        const purchase = await this.prisma.userContent.findUnique({
            where: {
                userId_contentId: { userId, contentId },
            },
        });
        return !!purchase;
    }
    async getPurchasedContent(userId) {
        const purchases = await this.prisma.userContent.findMany({
            where: { userId },
            include: { content: true },
        });
        return purchases.map((p) => p.content);
    }
};
exports.UsersContentService = UsersContentService;
exports.UsersContentService = UsersContentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersContentService);
//# sourceMappingURL=users-content.service.js.map