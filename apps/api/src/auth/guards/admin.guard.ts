import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user is admin
    const admin = await this.prisma.admin.findUnique({
      where: { telegramId: user.telegramId },
    });

    if (!admin) {
      throw new ForbiddenException('Admin access required');
    }

    // Attach admin info to request
    request.admin = admin;
    return true;
  }
}
