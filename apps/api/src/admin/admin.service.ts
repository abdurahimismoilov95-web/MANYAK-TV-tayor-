import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.admin.findMany({
      orderBy: { appointedAt: 'desc' },
    });
  }

  async create(data: any) {
    return this.prisma.admin.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.admin.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.admin.delete({ where: { id } });
  }

  async getSystemStats() {
    const [users, content, payments, admins] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.content.count(),
      this.prisma.payment.count({ where: { status: 'APPROVED' } }),
      this.prisma.admin.count(),
    ]);

    return { users, content, payments, admins };
  }
}
