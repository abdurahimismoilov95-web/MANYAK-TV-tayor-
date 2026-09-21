import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentType, PaymentStatus } from '@prisma/client';

interface CreatePaymentDto {
  userId: string;
  type: PaymentType;
  amount: number;
  planId?: string;
  contentId?: string;
  receiptImageUrl?: string;
  promoCode?: string;
  notes?: string;
}

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePaymentDto) {
    let discountApplied = 0;
    let finalAmount = data.amount;

    // Apply promo code if provided
    if (data.promoCode) {
      const promo = await this.prisma.promoCode.findUnique({
        where: { code: data.promoCode },
      });

      if (promo && promo.isActive && promo.currentUses < promo.maxUses) {
        if (!promo.expiresAt || promo.expiresAt > new Date()) {
          discountApplied = Math.floor(
            (data.amount * promo.discountPercent) / 100,
          );
          finalAmount = data.amount - discountApplied;

          // Increment promo code usage
          await this.prisma.promoCode.update({
            where: { id: promo.id },
            data: { currentUses: { increment: 1 } },
          });
        }
      }
    }

    // Get plan/content details
    let planName: string | undefined;
    let contentTitle: string | undefined;

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

  async findAll(status?: PaymentStatus, page = 1, limit = 50) {
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

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        user: true,
        plan: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async findByUser(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
  }

  async approve(id: string, reviewerId: string) {
    const payment = await this.findOne(id);

    if (payment.status !== 'PENDING') {
      throw new BadRequestException('Payment already reviewed');
    }

    // Update payment status
    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      },
    });

    // Apply benefits
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

      // Update content revenue
      await this.prisma.content.update({
        where: { id: payment.contentId },
        data: {
          revenue: { increment: payment.amount },
        },
      });
    }

    return updatedPayment;
  }

  async reject(id: string, reviewerId: string, reason?: string) {
    const payment = await this.findOne(id);

    if (payment.status !== 'PENDING') {
      throw new BadRequestException('Payment already reviewed');
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
    const [
      totalPayments,
      pendingPayments,
      approvedPayments,
      rejectedPayments,
      totalRevenue,
      todayRevenue,
    ] = await Promise.all([
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
}
