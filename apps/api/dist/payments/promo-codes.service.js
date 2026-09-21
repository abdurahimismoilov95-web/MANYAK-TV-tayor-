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
exports.PromoCodesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PromoCodesService = class PromoCodesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async validate(code) {
        const promo = await this.prisma.promoCode.findUnique({
            where: { code: code.toUpperCase() },
        });
        if (!promo) {
            throw new common_1.BadRequestException('Invalid promo code');
        }
        if (!promo.isActive) {
            throw new common_1.BadRequestException('Promo code is inactive');
        }
        if (promo.currentUses >= promo.maxUses) {
            throw new common_1.BadRequestException('Promo code usage limit reached');
        }
        if (promo.expiresAt && promo.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Promo code expired');
        }
        return {
            valid: true,
            discountPercent: promo.discountPercent,
            code: promo.code,
        };
    }
    async findAll() {
        return this.prisma.promoCode.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(data) {
        return this.prisma.promoCode.create({
            data: { ...data, code: data.code.toUpperCase() },
        });
    }
    async update(id, data) {
        return this.prisma.promoCode.update({ where: { id }, data });
    }
    async remove(id) {
        return this.prisma.promoCode.delete({ where: { id } });
    }
};
exports.PromoCodesService = PromoCodesService;
exports.PromoCodesService = PromoCodesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PromoCodesService);
//# sourceMappingURL=promo-codes.service.js.map