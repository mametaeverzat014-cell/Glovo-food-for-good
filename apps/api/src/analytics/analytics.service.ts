import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Orders in these states represent food that was actually rescued (not cancelled).
const RESCUED_STATES = [OrderStatus.PAID, OrderStatus.PICKED_UP, OrderStatus.COMPLETED];

// Rough estimate of greenhouse-gas emissions avoided per rescued meal (kg CO2e).
// Based on ~2.5 kg CO2e per kg of food waste prevented.
const CO2_PER_MEAL_KG = 2.5;

interface OrderRow {
  quantity: number;
  totalPrice: { toString(): string };
  offer: { originalPrice: { toString(): string } };
}

function summarise(orders: OrderRow[]) {
  let mealsSaved = 0;
  let moneyRecovered = 0;
  let originalValue = 0;

  for (const o of orders) {
    mealsSaved += o.quantity;
    moneyRecovered += Number(o.totalPrice);
    originalValue += Number(o.offer.originalPrice) * o.quantity;
  }

  return {
    mealsSaved,
    moneyRecovered: Math.round(moneyRecovered),
    customerSavings: Math.round(originalValue - moneyRecovered),
    co2AvoidedKg: Math.round(mealsSaved * CO2_PER_MEAL_KG * 10) / 10,
    orders: orders.length,
  };
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Aggregated impact for a single restaurant (owner dashboard). */
  async forRestaurant(restaurantId: string, user: { id: string; role: Role }) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    if (user.role !== Role.ADMIN && restaurant.ownerId !== user.id) {
      throw new ForbiddenException('You do not own this restaurant');
    }

    const orders = await this.prisma.order.findMany({
      where: { offer: { restaurantId }, status: { in: RESCUED_STATES } },
      select: { quantity: true, totalPrice: true, offer: { select: { originalPrice: true } } },
    });

    return summarise(orders);
  }

  /** Platform-wide impact for the public landing page. */
  async platform() {
    const [orders, restaurants] = await Promise.all([
      this.prisma.order.findMany({
        where: { status: { in: RESCUED_STATES } },
        select: { quantity: true, totalPrice: true, offer: { select: { originalPrice: true } } },
      }),
      this.prisma.restaurant.count(),
    ]);

    return { ...summarise(orders), restaurants };
  }
}
