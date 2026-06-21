import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OfferStatus, Prisma, RestaurantStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { distanceKm } from '../common/geo';
import { CreateOfferDto, FeedQueryDto, UpdateOfferDto } from './dto/offer.dto';

/** Adds a derived discount percentage to an offer for the client. */
function withDiscount<T extends { originalPrice: Prisma.Decimal; discountedPrice: Prisma.Decimal }>(
  offer: T,
) {
  const original = Number(offer.originalPrice);
  const discounted = Number(offer.discountedPrice);
  const discountPercent =
    original > 0 ? Math.round(((original - discounted) / original) * 100) : 0;
  return { ...offer, discountPercent };
}

@Injectable()
export class OffersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
  ) {}

  async create(user: { id: string; role: Role }, dto: CreateOfferDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    if (user.role !== Role.ADMIN && restaurant.ownerId !== user.id) {
      throw new ForbiddenException('You do not own this restaurant');
    }
    if (user.role !== Role.ADMIN && restaurant.status !== RestaurantStatus.APPROVED) {
      throw new ForbiddenException('Ресторан ещё не одобрен основателем — публиковать предложения нельзя.');
    }
    if (dto.discountedPrice >= dto.originalPrice) {
      throw new BadRequestException('Discounted price must be lower than the original price');
    }
    if (new Date(dto.pickupEnd) <= new Date(dto.pickupStart)) {
      throw new BadRequestException('Pickup end must be after pickup start');
    }

    const offer = await this.prisma.offer.create({
      data: {
        restaurantId: dto.restaurantId,
        title: dto.title,
        description: dto.description,
        originalPrice: dto.originalPrice,
        discountedPrice: dto.discountedPrice,
        quantity: dto.quantity,
        category: dto.category,
        pickupStart: new Date(dto.pickupStart),
        pickupEnd: new Date(dto.pickupEnd),
        expiresAt: new Date(dto.expiresAt),
        images: dto.images ?? [],
      },
    });
    this.events.emitOffersChanged({ restaurantId: dto.restaurantId, offerId: offer.id });
    return withDiscount(offer);
  }

  /** Public marketplace feed with filters and sorting. */
  async feed(query: FeedQueryDto) {
    const restaurantFilter: Prisma.RestaurantWhereInput = {
      status: RestaurantStatus.APPROVED,
    };
    if (query.minRating != null) {
      restaurantFilter.rating = { gte: query.minRating };
    }
    const where: Prisma.OfferWhereInput = {
      status: OfferStatus.AVAILABLE,
      quantity: { gt: 0 },
      expiresAt: { gt: new Date() },
      restaurant: restaurantFilter,
    };
    if (query.category) {
      where.category = query.category;
    }
    if (query.maxPrice != null) {
      where.discountedPrice = { lte: query.maxPrice };
    }

    const offers = await this.prisma.offer.findMany({
      where,
      include: {
        restaurant: {
          select: { id: true, name: true, lat: true, lng: true, rating: true, imageUrl: true },
        },
        _count: { select: { orders: true } },
      },
    });

    let enriched = offers.map((offer) => {
      const dist =
        query.lat != null && query.lng != null
          ? Number(
              distanceKm(query.lat, query.lng, offer.restaurant.lat, offer.restaurant.lng).toFixed(
                2,
              ),
            )
          : null;
      return { ...withDiscount(offer), distanceKm: dist, orderCount: offer._count.orders };
    });

    // Distance and discount filters that can't run in SQL.
    if (query.minDiscount != null) {
      enriched = enriched.filter((o) => o.discountPercent >= query.minDiscount!);
    }
    if (query.maxDistanceKm != null) {
      enriched = enriched.filter((o) => o.distanceKm != null && o.distanceKm <= query.maxDistanceKm!);
    }

    enriched.sort(this.comparator(query.sort));
    return enriched;
  }

  private comparator(sort?: string) {
    switch (sort) {
      case 'cheapest':
        return (a: any, b: any) => Number(a.discountedPrice) - Number(b.discountedPrice);
      case 'discount':
        return (a: any, b: any) => b.discountPercent - a.discountPercent;
      case 'popular':
        return (a: any, b: any) => b.orderCount - a.orderCount;
      case 'nearest':
      default:
        return (a: any, b: any) => {
          if (a.distanceKm == null) return 1;
          if (b.distanceKm == null) return -1;
          return a.distanceKm - b.distanceKm;
        };
    }
  }

  /**
   * Personalised "For you" recommendations: scores available offers by the
   * user's favourite restaurants, previously ordered categories, discount and
   * rating. New users still get sensible results (discount/rating driven).
   */
  async recommend(userId: string) {
    const [orders, favorites] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        select: { offer: { select: { category: true, restaurantId: true } } },
        take: 50,
      }),
      this.prisma.favorite.findMany({ where: { userId }, select: { restaurantId: true } }),
    ]);

    const favRestaurants = new Set(favorites.map((f) => f.restaurantId));
    const categoryScore: Record<string, number> = {};
    for (const o of orders) {
      categoryScore[o.offer.category] = (categoryScore[o.offer.category] ?? 0) + 1;
      favRestaurants.add(o.offer.restaurantId); // ordered-from counts as a signal too
    }

    const offers = await this.prisma.offer.findMany({
      where: {
        status: OfferStatus.AVAILABLE,
        quantity: { gt: 0 },
        expiresAt: { gt: new Date() },
        restaurant: { status: RestaurantStatus.APPROVED },
      },
      include: {
        restaurant: { select: { id: true, name: true, rating: true, imageUrl: true } },
        _count: { select: { orders: true } },
      },
    });

    const scored = offers.map((offer) => {
      const withPct = withDiscount(offer);
      let score = 0;
      if (favRestaurants.has(offer.restaurantId)) score += 5;
      score += (categoryScore[offer.category] ?? 0) * 2;
      score += withPct.discountPercent / 20;
      score += Number(offer.restaurant.rating);
      score += offer._count.orders * 0.5;
      return { ...withPct, orderCount: offer._count.orders, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 8);
  }

  async findOne(id: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      include: { restaurant: true },
    });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    return withDiscount(offer);
  }

  async findByRestaurant(restaurantId: string) {
    const offers = await this.prisma.offer.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
    });
    return offers.map(withDiscount);
  }

  async update(id: string, user: { id: string; role: Role }, dto: UpdateOfferDto) {
    const offer = await this.assertOwnership(id, user);

    const data: Prisma.OfferUpdateInput = { ...dto };
    if (dto.pickupStart) data.pickupStart = new Date(dto.pickupStart);
    if (dto.pickupEnd) data.pickupEnd = new Date(dto.pickupEnd);
    if (dto.expiresAt) data.expiresAt = new Date(dto.expiresAt);

    // Auto-update availability when stock hits zero.
    if (dto.quantity != null) {
      data.status = dto.quantity > 0 ? OfferStatus.AVAILABLE : OfferStatus.SOLD_OUT;
    }
    if (dto.discountedPrice != null && dto.discountedPrice >= Number(offer.originalPrice)) {
      throw new BadRequestException('Discounted price must be lower than the original price');
    }

    const updated = await this.prisma.offer.update({ where: { id }, data });
    this.events.emitOffersChanged({ restaurantId: updated.restaurantId, offerId: id });
    return withDiscount(updated);
  }

  async remove(id: string, user: { id: string; role: Role }) {
    const offer = await this.assertOwnership(id, user);
    await this.prisma.offer.delete({ where: { id } });
    this.events.emitOffersChanged({ restaurantId: offer.restaurantId, offerId: id });
    return { success: true };
  }

  private async assertOwnership(id: string, user: { id: string; role: Role }) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      include: { restaurant: { select: { ownerId: true } } },
    });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    if (user.role !== Role.ADMIN && offer.restaurant.ownerId !== user.id) {
      throw new ForbiddenException('You do not own this offer');
    }
    return offer;
  }
}
