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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                favorites: {
                    include: {
                        content: {
                            select: {
                                id: true,
                                title: true,
                                posterUrl: true,
                                type: true,
                            },
                        },
                    },
                },
                watchHistory: {
                    include: {
                        content: {
                            select: {
                                id: true,
                                title: true,
                                posterUrl: true,
                                type: true,
                            },
                        },
                    },
                    orderBy: { watchedAt: 'desc' },
                    take: 20,
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const admin = await this.prisma.admin.findUnique({
            where: { telegramId: user.telegramId },
        });
        return {
            ...user,
            isAdmin: !!admin,
            isSuperAdmin: admin?.isSuperAdmin || false,
        };
    }
    async findByTelegramId(telegramId) {
        const user = await this.prisma.user.findUnique({
            where: { telegramId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async update(id, updateUserDto) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.prisma.user.update({
            where: { id },
            data: updateUserDto,
        });
    }
    async grantVip(id, grantVipDto) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + grantVipDto.durationDays);
        return this.prisma.user.update({
            where: { id },
            data: {
                isVip: true,
                vipExpiresAt: expiresAt,
            },
        });
    }
    async revokeVip(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.prisma.user.update({
            where: { id },
            data: {
                isVip: false,
                vipExpiresAt: null,
            },
        });
    }
    async banUser(id, banDto) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.prisma.user.update({
            where: { id },
            data: {
                isBanned: true,
                banReason: banDto.reason,
            },
        });
    }
    async unbanUser(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.prisma.user.update({
            where: { id },
            data: {
                isBanned: false,
                banReason: null,
            },
        });
    }
    async findAll(page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    telegramId: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    isVip: true,
                    vipExpiresAt: true,
                    isBanned: true,
                    createdAt: true,
                    lastLoginAt: true,
                },
            }),
            this.prisma.user.count(),
        ]);
        return {
            users,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getStats() {
        const [totalUsers, vipUsers, bannedUsers, activeToday,] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { isVip: true } }),
            this.prisma.user.count({ where: { isBanned: true } }),
            this.prisma.user.count({
                where: {
                    lastLoginAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ]);
        return {
            totalUsers,
            vipUsers,
            bannedUsers,
            activeToday,
        };
    }
    async addFavorite(userId, contentId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const content = await this.prisma.content.findUnique({ where: { id: contentId } });
        if (!content)
            throw new common_1.NotFoundException('Content not found');
        return this.prisma.favorite.create({
            data: {
                userId,
                contentId,
            },
        });
    }
    async removeFavorite(userId, contentId) {
        return this.prisma.favorite.delete({
            where: {
                userId_contentId: {
                    userId,
                    contentId,
                },
            },
        });
    }
    async getFavorites(userId) {
        const favorites = await this.prisma.favorite.findMany({
            where: { userId },
            include: {
                content: true,
            },
            orderBy: { addedAt: 'desc' },
        });
        return favorites.map((f) => f.content);
    }
    async getWatchHistory(userId, limit = 20) {
        return this.prisma.watchHistory.findMany({
            where: { userId },
            include: {
                content: true,
            },
            orderBy: { watchedAt: 'desc' },
            take: limit,
        });
    }
    async updateWatchProgress(userId, contentId, progressSeconds, totalSeconds, episodeId) {
        return this.prisma.watchHistory.create({
            data: {
                userId,
                contentId,
                episodeId,
                progressSeconds,
                totalSeconds,
            },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map