import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PlansService } from './plans.service';
import { PromoCodesService } from './promo-codes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private plansService: PlansService,
    private promoCodesService: PromoCodesService,
  ) {}

  // ========== PLANS ==========

  @Get('plans')
  @Public()
  @ApiOperation({ summary: 'Get all subscription plans' })
  async getPlans() {
    return this.plansService.findAll();
  }

  // ========== PROMO CODES ==========

  @Post('promo-codes/validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate promo code' })
  async validatePromo(@Body() body: { code: string }) {
    return this.promoCodesService.validate(body.code);
  }

  // ========== PAYMENTS ==========

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.paymentsService.create({ ...body, userId });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my payments' })
  async getMyPayments(@CurrentUser('id') userId: string) {
    return this.paymentsService.findByUser(userId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment statistics (admin only)' })
  async getStats() {
    return this.paymentsService.getStats();
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments (admin only)' })
  async findAll(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentsService.findAll(status as any, page, limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by ID (admin only)' })
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve payment (admin only)' })
  async approve(
    @Param('id') id: string,
    @CurrentUser('id') reviewerId: string,
  ) {
    return this.paymentsService.approve(id, reviewerId);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject payment (admin only)' })
  async reject(
    @Param('id') id: string,
    @CurrentUser('id') reviewerId: string,
    @Body() body: { reason?: string },
  ) {
    return this.paymentsService.reject(id, reviewerId, body.reason);
  }
}
