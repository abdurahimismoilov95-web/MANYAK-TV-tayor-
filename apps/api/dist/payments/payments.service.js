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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PaymentsService = class PaymentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        let discountApplied = 0;
        let finalAmount = data.amount;
        if (data.promoCode) {
            const promo = await this.prisma.promoCode.findUnique({
                where: { code: data.promoCode },
            });
            if (promo && promo.isActive && promo.currentUses < promo.maxUses) {
                if (!promo.expiresAt || promo.expiresAt > new Date()) {
                    discountApplied = Math.floor((data.amount * promo.discountPercent) / 100);
                    finalAmount = data.amount - discountApplied;
                    await this.prisma.promoCode.update({
                        where: { id: promo.id },
                        data: { currentUses: { increment: 1 } },
                    });
                }
            }
        }
        let planName;
        let contentTitle;
        if (data.planId) {
            const plan = await this.prisma.subscriptionPlan.findUnique({
                where: { id: data.planId },
            });
            planName = plan?.name;
        }
        if (data.contentId) {
            const content = await this.prisma.content.findUnique({
                where: { id: data.contentId },
            });
            contentTitle = content?.title;
        }
        const user = await this.prisma.user.findUnique({
            where: { id: data.userId },
        });
        return this.prisma.payment.create({
            data: {
                userId: data.userId,
                type: data.type,
                amount: finalAmount,
                discountApplied,
                promoCodeUsed: data.promoCode,
                planId: data.planId,
                contentId: data.contentId,
                contentTitle,
                receiptImageUrl: data.receiptImageUrl,
                notes: data.notes,
                status: 'PENDING',
            },
        });
    }
    async findAll(status, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const where = status ? { status } : {};
        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { user: true },
            }),
            this.prisma.payment.count({ where }),
        ]);
        return {
            payments,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const payment = await this.prisma.payment.findUnique({
            where: { id },
            include: {
                user: true,
                plan: true,
            },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        return payment;
    }
    async findByUser(userId) {
        return this.prisma.payment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { plan: true },
        });
    }
    async approve(id, reviewerId) {
        const payment = await this.findOne(id);
        if (payment.status !== 'PENDING') {
            throw new common_1.BadRequestException('Payment already reviewed');
        }
        const updatedPayment = await this.prisma.payment.update({
            where: { id },
            data: {
                status: 'APPROVED',
                reviewedAt: new Date(),
                reviewedBy: reviewerId,
            },
        });
        if (payment.type === 'VIP_SUBSCRIPTION' && payment.planId) {
            const plan = await this.prisma.subscriptionPlan.findUnique({
                where: { id: payment.planId },
            });
            if (plan) {
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + plan.durationDays);
                await this.prisma.user.update({
                    where: { id: payment.userId },
                    data: {
                        isVip: true,
                        vipExpiresAt: expiresAt,
                    },
                });
            }
        }
        if (payment.type === 'CONTENT_PURCHASE' && payment.contentId) {
            await this.prisma.userContent.create({
                data: {
                    userId: payment.userId,
                    contentId: payment.contentId,
                },
            });
            await this.prisma.content.update({
                where: { id: payment.contentId },
                data: {
                    revenue: { increment: payment.amount },
                },
            });
        }
        return updatedPayment;
    }
    async reject(id, reviewerId, reason) {
        const payment = await this.findOne(id);
        if (payment.status !== 'PENDING') {
            throw new common_1.BadRequestException('Payment already reviewed');
        }
        return this.prisma.payment.update({
            where: { id },
            data: {
                status: 'REJECTED',
                reviewedAt: new Date(),
                reviewedBy: reviewerId,
                notes: reason
                    ? `${payment.notes || ''}\nRejection reason: ${reason}`
                    : payment.notes,
            },
        });
    }
    async getStats() {
        const [totalPayments, pendingPayments, approvedPayments, rejectedPayments, totalRevenue, todayRevenue,] = await Promise.all([
            this.prisma.payment.count(),
            this.prisma.payment.count({ where: { status: 'PENDING' } }),
            this.prisma.payment.count({ where: { status: 'APPROVED' } }),
            this.prisma.payment.count({ where: { status: 'REJECTED' } }),
            this.prisma.payment.aggregate({
                where: { status: 'APPROVED' },
                _sum: { amount: true },
            }),
            this.prisma.payment.aggregate({
                where: {
                    status: 'APPROVED',
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
                _sum: { amount: true },
            }),
        ]);
        return {
            totalPayments,
            pendingPayments,
            approvedPayments,
            rejectedPayments,
            totalRevenue: totalRevenue._sum.amount || 0,
            todayRevenue: todayRevenue._sum.amount || 0,
        };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map