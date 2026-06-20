import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { OffersModule } from './offers/offers.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { FavoritesModule } from './favorites/favorites.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UploadsModule } from './uploads/uploads.module';
import { GeocodingModule } from './geocoding/geocoding.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EventsModule,
    AuthModule,
    UsersModule,
    RestaurantsModule,
    OffersModule,
    OrdersModule,
    ReviewsModule,
    FavoritesModule,
    NotificationsModule,
    UploadsModule,
    GeocodingModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
