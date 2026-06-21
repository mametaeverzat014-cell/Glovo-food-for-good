import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, OfferStatus, RestaurantStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { distanceKm } from '../common/geo';
import { CreateRestaurantDto, UpdateRestaurantDto } from './dto/restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Submit a restaurant application — starts as PENDING founder review. */
  create(ownerId: string, dto: CreateRestaurantDto) {
    return this.prisma.restaurant.create({
      data: { ...dto, ownerId, status: RestaurantStatus.PENDING, verified: false },
    });
  }

  /** Public list — only approved restaurants. */
  async findAll(params: { lat?: number; lng?: number }) {
    const restaurants = await this.prisma.restaurant.findMany({
      where: { status: RestaurantStatus.APPROVED },
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

  /** Restaurants owned by the current user (owner dashboard) — all statuses. */
  findMine(ownerId: string) {
    return this.prisma.restaurant.findMany({
      where: { ownerId },
      include: { _count: { select: { offers: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Pending applications for the founder inbox. */
  findPending() {
    return this.prisma.restaurant.findMany({
      where: { status: RestaurantStatus.PENDING },
      include: {
        owner: { select: { name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'asc' },
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

  /** Founder approves an application. */
  async approve(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    const updated = await this.prisma.restaurant.update({
      where: { id },
      data: { status: RestaurantStatus.APPROVED, verified: true, rejectionReason: null },
    });
    await this.notifyOwner(
      restaurant.ownerId,
      NotificationType.RESTAURANT_APPROVED,
      `Ваш ресторан «${restaurant.name}» одобрен. Теперь можно публиковать предложения!`,
    );
    return updated;
  }

  /** Founder rejects an application with an optional reason. */
  async reject(id: string, reason?: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    const updated = await this.prisma.restaurant.update({
      where: { id },
      data: { status: RestaurantStatus.REJECTED, verified: false, rejectionReason: reason ?? null },
    });
    await this.notifyOwner(
      restaurant.ownerId,
      NotificationType.RESTAURANT_REJECTED,
      `Заявка на «${restaurant.name}» отклонена${reason ? `: ${reason}` : '.'}`,
    );
    return updated;
  }

  async remove(id: string, user: { id: string; role: Role }) {
    await this.assertOwnership(id, user);
    await this.prisma.restaurant.delete({ where: { id } });
    return { success: true };
  }

  private notifyOwner(userId: string, type: NotificationType, message: string) {
    return this.prisma.notification.create({ data: { userId, type, message } });
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
