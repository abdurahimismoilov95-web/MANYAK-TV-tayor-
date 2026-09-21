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
exports.ContentStatsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ContentStatsService = class ContentStatsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async incrementViews(contentId) {
        return this.prisma.content.update({
            where: { id: contentId },
            data: { views: { increment: 1 } },
        });
    }
    async getStats() {
        const [totalContent, movies, series, totalViews, totalRevenue,] = await Promise.all([
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
};
exports.ContentStatsService = ContentStatsService;
exports.ContentStatsService = ContentStatsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContentStatsService);
//# sourceMappingURL=content-stats.service.js.map