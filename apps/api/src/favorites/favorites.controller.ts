import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.favorites.list(user.id);
  }

  @Post(':restaurantId')
  add(@CurrentUser() user: AuthUser, @Param('restaurantId') restaurantId: string) {
    return this.favorites.add(user.id, restaurantId);
  }

  @Delete(':restaurantId')
  remove(@CurrentUser() user: AuthUser, @Param('restaurantId') restaurantId: string) {
    return this.favorites.remove(user.id, restaurantId);
  }
}
