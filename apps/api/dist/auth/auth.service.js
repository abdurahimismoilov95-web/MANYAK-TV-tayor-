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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_1 = require("crypto");
let AuthService = class AuthService {
    constructor(prisma, jwtService, config) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.config = config;
    }
    async verifyTelegramInitData(initData) {
        const botToken = this.config.get('TELEGRAM_BOT_TOKEN');
        if (!botToken) {
            throw new common_1.UnauthorizedException('Bot token not configured');
        }
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        urlParams.delete('hash');
        const dataCheckString = Array.from(urlParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
        const secretKey = (0, crypto_1.createHmac)('sha256', 'WebAppData')
            .update(botToken)
            .digest();
        const computedHash = (0, crypto_1.createHmac)('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');
        if (hash !== computedHash) {
            throw new common_1.UnauthorizedException('Invalid Telegram data');
        }
        const userDataString = urlParams.get('user');
        if (!userDataString) {
            throw new common_1.UnauthorizedException('User data not found');
        }
        const userData = JSON.parse(userDataString);
        return userData;
    }
    async loginWithTelegram(initData) {
        const telegramUser = await this.verifyTelegramInitData(initData);
        let user = await this.prisma.user.findUnique({
            where: { telegramId: String(telegramUser.id) },
        });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    telegramId: String(telegramUser.id),
                    firstName: telegramUser.first_name || 'User',
                    lastName: telegramUser.last_name,
                    username: telegramUser.username,
                    lastLoginAt: new Date(),
                },
            });
        }
        else {
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
        }
        const admin = await this.prisma.admin.findUnique({
            where: { telegramId: user.telegramId },
        });
        const payload = {
            sub: user.id,
            telegramId: user.telegramId,
            isVip: user.isVip,
            isAdmin: !!admin,
            isSuperAdmin: admin?.isSuperAdmin || false,
        };
        const accessToken = this.jwtService.sign(payload);
        return {
            ok: true,
            token: accessToken,
            user: {
                id: user.id,
                telegramId: user.telegramId,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                isVip: user.isVip,
                isAdmin: !!admin,
                isSuperAdmin: admin?.isSuperAdmin || false,
            },
        };
    }
    async validateUser(payload) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (user.isBanned) {
            throw new common_1.UnauthorizedException('User is banned');
        }
        return user;
    }
    async getCurrentUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const admin = await this.prisma.admin.findUnique({
            where: { telegramId: user.telegramId },
        });
        return {
            ...user,
            isAdmin: !!admin,
            isSuperAdmin: admin?.isSuperAdmin || false,
            adminPermissions: admin?.permissions,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map