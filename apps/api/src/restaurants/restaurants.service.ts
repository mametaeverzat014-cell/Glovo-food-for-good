import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OfferStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { distanceKm } from '../common/geo';
import { CreateRestaurantDto, UpdateRestaurantDto } from './dto/restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  create(ownerId: string, dto: CreateRestaurantDto) {
    return this.prisma.restaurant.create({
      data: { ...dto, ownerId },
    });
  }

  async findAll(params: { lat?: number; lng?: number }) {
    const restaurants = await this.prisma.restaurant.findMany({
      include: {
        _count: { select: { offers: { where: { status: OfferStatus.AVAILABLE } } } },
      },
      orderBy: { rating: 'desc' },
    });

    return restaurants.map((r) => ({
      ...r,
      activeOffers: r._count.offers,
      distanceKm:
        params.lat != null && params.lng != null
          ? Number(distanceKm(params.lat, params.lng, r.lat, r.lng).toFixed(2))
          : null,
    }));
  }

  /** Restaurants owned by the current user (owner dashboard). */
  findMine(ownerId: string) {
    return this.prisma.restaurant.findMany({
      where: { ownerId },
      include: { _count: { select: { offers: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        offers: {
          where: { status: OfferStatus.AVAILABLE },
          orderBy: { pickupEnd: 'asc' },
        },
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    return restaurant;
  }

  async update(id: string, user: { id: string; role: Role }, dto: UpdateRestaurantDto) {
    await this.assertOwnership(id, user);
    return this.prisma.restaurant.update({ where: { id }, data: dto });
  }

  async verify(id: string) {
    const exists = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Restaurant not found');
    }
    return this.prisma.restaurant.update({ where: { id }, data: { verified: true } });
  }

  async remove(id: string, user: { id: string; role: Role }) {
    await this.assertOwnership(id, user);
    await this.prisma.restaurant.delete({ where: { id } });
    return { success: true };
  }

  /** Throws unless the user owns the restaurant or is an admin. */
  private async assertOwnership(id: string, user: { id: string; role: Role }) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    if (user.role !== Role.ADMIN && restaurant.ownerId !== user.id) {
      throw new ForbiddenException('You do not own this restaurant');
    }
    return restaurant;
  }
}
