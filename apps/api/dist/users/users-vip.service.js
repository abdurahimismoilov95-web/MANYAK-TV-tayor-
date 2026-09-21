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
exports.UsersVipService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersVipService = class UsersVipService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async grantVip(userId, durationDays) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                isVip: true,
                vipExpiresAt: expiresAt,
            },
        });
    }
    async revokeVip(userId) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                isVip: false,
                vipExpiresAt: null,
            },
        });
    }
    async checkVipExpiration(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.isVip && user.vipExpiresAt && user.vipExpiresAt < new Date()) {
            await this.revokeVip(userId);
            return { expired: true, user };
        }
        return { expired: false, user };
    }
    async getVipUsers(page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where: { isVip: true },
                skip,
                take: limit,
                orderBy: { vipExpiresAt: 'asc' },
            }),
            this.prisma.user.count({ where: { isVip: true } }),
        ]);
        return { users, total, page, totalPages: Math.ceil(total / limit) };
    }
    async getExpiringVipUsers() {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        return this.prisma.user.findMany({
            where: {
                isVip: true,
                vipExpiresAt: {
                    lte: sevenDaysFromNow,
                    gte: new Date(),
                },
            },
            orderBy: { vipExpiresAt: 'asc' },
        });
    }
    async extendVip(userId, additionalDays) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        let newExpiryDate;
        if (user.isVip && user.vipExpiresAt && user.vipExpiresAt > new Date()) {
            newExpiryDate = new Date(user.vipExpiresAt);
            newExpiryDate.setDate(newExpiryDate.getDate() + additionalDays);
        }
        else {
            newExpiryDate = new Date();
            newExpiryDate.setDate(newExpiryDate.getDate() + additionalDays);
        }
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                isVip: true,
                vipExpiresAt: newExpiryDate,
            },
        });
    }
    async getVipStats() {
        const [totalVip, active, expiringSoon] = await Promise.all([
            this.prisma.user.count({ where: { isVip: true } }),
            this.prisma.user.count({
                where: {
                    isVip: true,
                    vipExpiresAt: { gt: new Date() },
                },
            }),
            this.prisma.user.count({
                where: {
                    isVip: true,
                    vipExpiresAt: {
                        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        gt: new Date(),
                    },
                },
            }),
        ]);
        return { totalVip, active, expiringSoon };
    }
};
exports.UsersVipService = UsersVipService;
exports.UsersVipService = UsersVipService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersVipService);
//# sourceMappingURL=users-vip.service.js.map