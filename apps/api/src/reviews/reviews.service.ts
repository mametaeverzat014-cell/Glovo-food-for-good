import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Only customers who completed an order here may review it.
    const completed = await this.prisma.order.findFirst({
      where: {
        userId,
        status: OrderStatus.COMPLETED,
        offer: { restaurantId: dto.restaurantId },
      },
    });
    if (!completed) {
      throw new BadRequestException('You can only review restaurants you have ordered from');
    }

    const existing = await this.prisma.review.findUnique({
      where: { userId_restaurantId: { userId, restaurantId: dto.restaurantId } },
    });
    if (existing) {
      throw new BadRequestException('You have already reviewed this restaurant');
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        restaurantId: dto.restaurantId,
        rating: dto.rating,
        foodQuality: dto.foodQuality,
        value: dto.value,
        pickupExperience: dto.pickupExperience,
        comment: dto.comment,
      },
    });

    await this.recomputeRating(dto.restaurantId);
    return review;
  }

  findByRestaurant(restaurantId: string) {
    return this.prisma.review.findMany({
      where: { restaurantId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Recomputes a restaurant's average rating and review count. */
  private async recomputeRating(restaurantId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { restaurantId },
      _avg: { rating: true },
      _count: true,
    });
    await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        rating: Number((agg._avg.rating ?? 0).toFixed(2)),
        reviewCount: agg._count,
      },
    });
  }
}
