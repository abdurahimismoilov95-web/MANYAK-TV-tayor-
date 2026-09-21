import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    adminId: string;
    adminName: string;
    action: string;
    targetType?: string;
    targetId?: string;
    targetTitle?: string;
    details?: string;
  }) {
    return this.prisma.auditLog.create({ data });
  }

  async findAll(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count(),
    ]);

    return { logs, total, page, totalPages: Math.ceil(total / limit) };
  }
}
