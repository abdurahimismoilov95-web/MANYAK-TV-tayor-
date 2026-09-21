import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private adminService: AdminService,
    private auditService: AuditService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get system statistics' })
  async getStats() {
    return this.adminService.getSystemStats();
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs' })
  async getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.findAll(page, limit);
  }

  @Get('admins')
  @ApiOperation({ summary: 'Get all admins' })
  async getAdmins() {
    return this.adminService.findAll();
  }

  @Post('admins')
  @ApiOperation({ summary: 'Create admin' })
  async createAdmin(@Body() data: any) {
    return this.adminService.create(data);
  }
}
