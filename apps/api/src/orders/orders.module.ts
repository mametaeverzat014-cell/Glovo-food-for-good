import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { StripeService } from '../payments/stripe.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, StripeService],
})
export class OrdersModule {}
