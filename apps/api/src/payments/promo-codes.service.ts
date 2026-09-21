import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PromoCodesService {
  constructor(private prisma: PrismaService) {}

  async validate(code: string) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo) {
      throw new BadRequestException('Invalid promo code');
    }

    if (!promo.isActive) {
      throw new BadRequestException('Promo code is inactive');
    }

    if (promo.currentUses >= promo.maxUses) {
      throw new BadRequestException('Promo code usage limit reached');
    }

    if (promo.expiresAt && promo.expiresAt < new Date()) {
      throw new BadRequestException('Promo code expired');
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

  async create(data: any) {
    return this.prisma.promoCode.create({
      data: { ...data, code: data.code.toUpperCase() },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.promoCode.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.promoCode.delete({ where: { id } });
  }
}
