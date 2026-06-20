import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationType,
  OfferStatus,
  OrderStatus,
  PaymentStatus,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../payments/stripe.service';
import { CreateOrderDto } from './dto/order.dto';

/** Generates a short human-readable pickup code (e.g. "FS-4827"). */
function pickupCode(): string {
  return `FS-${Math.floor(1000 + Math.random() * 9000)}`;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly config: ConfigService,
  ) {}

  private webUrl(): string {
    const explicit = this.config.get<string>('WEB_URL');
    if (explicit) return explicit.replace(/\/$/, '');
    const cors = this.config.get<string>('CORS_ORIGINS');
    return (cors?.split(',')[0] ?? 'http://localhost:3000').trim().replace(/\/$/, '');
  }

  /**
   * Create a Stripe Checkout session for a reserved order and return its URL.
   * The frontend redirects the customer to this hosted payment page.
   */
  async createCheckout(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { offer: true },
    });
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== OrderStatus.RESERVED) {
      throw new BadRequestException(`Cannot pay an order in status ${order.status}`);
    }

    const web = this.webUrl();
    // KZT is a two-decimal currency for Stripe, so amounts are in tiyn (1/100).
    const unitAmount = Math.round(Number(order.totalPrice) * 100);

    const session = await this.stripe.client_.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: order.id,
      metadata: { orderId: order.id, userId },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'kzt',
            unit_amount: unitAmount,
            product_data: { name: order.offer.title },
          },
        },
      ],
      success_url: `${web}/orders?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${web}/orders?checkout=cancel`,
    });

    return { url: session.url };
  }

  /**
   * Verify a completed Checkout session with Stripe and mark the order paid.
   * Idempotent: re-confirming an already-paid order is a no-op.
   */
  async confirmCheckout(sessionId: string, userId: string) {
    const session = await this.stripe.client_.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      throw new NotFoundException('Unknown payment session');
    }

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== OrderStatus.RESERVED) {
      return order; // already processed
    }
    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Payment was not completed');
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID, paymentStatus: PaymentStatus.PAID },
    });
    await this.notify(userId, NotificationType.ORDER_PAID, 'Payment received. See you at pickup!');
    return updated;
  }

  /**
   * Reserve an offer. Decrements stock atomically inside a transaction so that
   * concurrent buyers cannot oversell the available quantity.
   */
  async reserve(userId: string, dto: CreateOrderDto) {
    const quantity = dto.quantity ?? 1;

    return this.prisma.$transaction(async (tx) => {
      const offer = await tx.offer.findUnique({ where: { id: dto.offerId } });
      if (!offer) {
        throw new NotFoundException('Offer not found');
      }
      if (offer.status !== OfferStatus.AVAILABLE || offer.expiresAt <= new Date()) {
        throw new BadRequestException('This offer is no longer available');
      }
      if (offer.quantity < quantity) {
        throw new BadRequestException(`Only ${offer.quantity} left in stock`);
      }

      const remaining = offer.quantity - quantity;
      await tx.offer.update({
        where: { id: offer.id },
        data: {
          quantity: remaining,
          status: remaining === 0 ? OfferStatus.SOLD_OUT : OfferStatus.AVAILABLE,
        },
      });

      const totalPrice = offer.discountedPrice.mul(quantity);
      const order = await tx.order.create({
        data: {
          userId,
          offerId: offer.id,
          quantity,
          totalPrice,
          status: OrderStatus.RESERVED,
          paymentStatus: PaymentStatus.PENDING,
          pickupCode: pickupCode(),
        },
      });

      await tx.notification.create({
        data: {
          userId,
          type: NotificationType.ORDER_CONFIRMED,
          message: `Your reservation for "${offer.title}" is confirmed. Pickup code ${order.pickupCode}.`,
        },
      });

      return order;
    });
  }

  findMine(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { offer: { include: { restaurant: { select: { name: true, address: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Orders placed against a restaurant's offers (owner pickup view). */
  async findForRestaurant(restaurantId: string, user: { id: string; role: Role }) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    if (user.role !== Role.ADMIN && restaurant.ownerId !== user.id) {
      throw new ForbiddenException('You do not own this restaurant');
    }
    return this.prisma.order.findMany({
      where: { offer: { restaurantId } },
      include: {
        offer: { select: { title: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: { id: string; role: Role }) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { offer: { include: { restaurant: true } } },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const isOwnerOfRestaurant = order.offer.restaurant.ownerId === user.id;
    if (user.role !== Role.ADMIN && order.userId !== user.id && !isOwnerOfRestaurant) {
      throw new ForbiddenException('You cannot view this order');
    }
    return order;
  }

  /** Mock payment confirmation: RESERVED -> PAID. */
  async pay(id: string, userId: string) {
    const order = await this.getOwnOrder(id, userId);
    if (order.status !== OrderStatus.RESERVED) {
      throw new BadRequestException(`Cannot pay an order in status ${order.status}`);
    }
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.PAID, paymentStatus: PaymentStatus.PAID },
    });
    await this.notify(userId, NotificationType.ORDER_PAID, 'Payment received. See you at pickup!');
    return updated;
  }

  /** Restaurant marks the order collected: PAID -> PICKED_UP. */
  async markPickedUp(id: string, user: { id: string; role: Role }) {
    const order = await this.findOne(id, user);
    if (user.role !== Role.ADMIN && order.offer.restaurant.ownerId !== user.id) {
      throw new ForbiddenException('Only the restaurant can mark an order picked up');
    }
    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException(`Cannot pick up an order in status ${order.status}`);
    }
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.PICKED_UP },
    });
    await this.notify(order.userId, NotificationType.PICKUP_READY, 'Enjoy your meal! 🍽️');
    return updated;
  }

  /** Customer confirms completion: PICKED_UP -> COMPLETED. */
  async complete(id: string, userId: string) {
    const order = await this.getOwnOrder(id, userId);
    if (order.status !== OrderStatus.PICKED_UP) {
      throw new BadRequestException(`Cannot complete an order in status ${order.status}`);
    }
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.COMPLETED },
    });
    await this.notify(userId, NotificationType.ORDER_COMPLETED, 'Thanks for saving food with us! ♻️');
    return updated;
  }

  /** Cancel a RESERVED/PAID order and return stock to the offer. */
  async cancel(id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id } });
      if (!order || order.userId !== userId) {
        throw new NotFoundException('Order not found');
      }
      if (order.status !== OrderStatus.RESERVED && order.status !== OrderStatus.PAID) {
        throw new BadRequestException(`Cannot cancel an order in status ${order.status}`);
      }

      await tx.offer.update({
        where: { id: order.offerId },
        data: {
          quantity: { increment: order.quantity },
          status: OfferStatus.AVAILABLE,
        },
      });

      return tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus:
            order.paymentStatus === PaymentStatus.PAID
              ? PaymentStatus.REFUNDED
              : order.paymentStatus,
        },
      });
    });
  }

  private async getOwnOrder(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  private notify(userId: string, type: NotificationType, message: string) {
    return this.prisma.notification.create({ data: { userId, type, message } });
  }
}
