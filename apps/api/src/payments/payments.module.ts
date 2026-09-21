import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PlansService } from './plans.service';
import { PromoCodesService } from './promo-codes.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PlansService, PromoCodesService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
