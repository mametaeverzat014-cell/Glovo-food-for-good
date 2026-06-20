import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateRestaurantDto, UpdateRestaurantDto } from './dto/restaurant.dto';
import { RestaurantsService } from './restaurants.service';

@Controller('restaurants')
@UseGuards(RolesGuard)
export class RestaurantsController {
  constructor(private readonly restaurants: RestaurantsService) {}

  @Public()
  @Get()
  findAll(@Query('lat') lat?: string, @Query('lng') lng?: string) {
    return this.restaurants.findAll({
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
    });
  }

  @Get('mine')
  @Roles(Role.RESTAURANT_OWNER, Role.ADMIN)
  findMine(@CurrentUser() user: AuthUser) {
    return this.restaurants.findMine(user.id);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.restaurants.findOne(id);
  }

  @Post()
  @Roles(Role.RESTAURANT_OWNER, Role.ADMIN)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRestaurantDto) {
    return this.restaurants.create(user.id, dto);
  }

  @Patch(':id')
  @Roles(Role.RESTAURANT_OWNER, Role.ADMIN)
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateRestaurantDto,
  ) {
    return this.restaurants.update(id, user, dto);
  }

  // Admin verification workflow.
  @Patch(':id/verify')
  @Roles(Role.ADMIN)
  verify(@Param('id') id: string) {
    return this.restaurants.verify(id);
  }

  @Delete(':id')
  @Roles(Role.RESTAURANT_OWNER, Role.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.restaurants.remove(id, user);
  }
}
