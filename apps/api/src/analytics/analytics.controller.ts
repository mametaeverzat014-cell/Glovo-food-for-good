import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(RolesGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Public()
  @Get('platform')
  platform() {
    return this.analytics.platform();
  }

  @Get('restaurant/:restaurantId')
  @Roles(Role.RESTAURANT_OWNER, Role.ADMIN)
  forRestaurant(@Param('restaurantId') restaurantId: string, @CurrentUser() user: AuthUser) {
    return this.analytics.forRestaurant(restaurantId, user);
  }
}
