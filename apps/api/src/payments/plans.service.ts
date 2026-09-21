import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.subscriptionPlan.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.subscriptionPlan.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.subscriptionPlan.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.subscriptionPlan.delete({ where: { id } });
  }
}
