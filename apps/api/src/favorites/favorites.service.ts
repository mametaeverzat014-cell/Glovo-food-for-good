import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: { restaurant: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Adds a favorite; idempotent thanks to the unique (userId, restaurantId) constraint. */
  async add(userId: string, restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    return this.prisma.favorite.upsert({
      where: { userId_restaurantId: { userId, restaurantId } },
      create: { userId, restaurantId },
      update: {},
    });
  }

  async remove(userId: string, restaurantId: string) {
    await this.prisma.favorite.deleteMany({ where: { userId, restaurantId } });
    return { success: true };
  }
}
