import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateOrderDto } from './dto/order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(RolesGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    return this.orders.findMine(user.id);
  }

  // Orders for a restaurant the current user owns (pickup management).
  @Get('restaurant/:restaurantId')
  @Roles(Role.RESTAURANT_OWNER, Role.ADMIN)
  findForRestaurant(@Param('restaurantId') restaurantId: string, @CurrentUser() user: AuthUser) {
    return this.orders.findForRestaurant(restaurantId, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orders.findOne(id, user);
  }

  @Post()
  @Roles(Role.CUSTOMER, Role.ADMIN)
  reserve(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.orders.reserve(user.id, dto);
  }

  // Stripe Checkout: create a hosted payment session, returns { url }.
  @Post(':id/checkout')
  checkout(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orders.createCheckout(id, user.id);
  }

  // Confirm a returned Checkout session and mark the order paid.
  @Post('checkout/confirm')
  confirmCheckout(@Body('sessionId') sessionId: string, @CurrentUser() user: AuthUser) {
    return this.orders.confirmCheckout(sessionId, user.id);
  }

  // Legacy/manual mock payment (kept for testing without Stripe).
  @Post(':id/pay')
  pay(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orders.pay(id, user.id);
  }

  // Restaurant owner confirms the customer collected the order.
  @Post(':id/pickup')
  @Roles(Role.RESTAURANT_OWNER, Role.ADMIN)
  markPickedUp(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orders.markPickedUp(id, user);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orders.complete(id, user.id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orders.cancel(id, user.id);
  }
}
