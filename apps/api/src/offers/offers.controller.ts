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
import { CreateOfferDto, FeedQueryDto, UpdateOfferDto } from './dto/offer.dto';
import { AssistOfferDto } from './dto/assist.dto';
import { OffersService } from './offers.service';
import { AiService } from '../ai/ai.service';

@Controller('offers')
@UseGuards(RolesGuard)
export class OffersController {
  constructor(
    private readonly offers: OffersService,
    private readonly ai: AiService,
  ) {}

  // Public marketplace feed with filters + sorting.
  @Public()
  @Get()
  feed(@Query() query: FeedQueryDto) {
    return this.offers.feed(query);
  }

  // Personalised feed for the logged-in customer.
  @Get('recommended')
  recommend(@CurrentUser() user: AuthUser) {
    return this.offers.recommend(user.id);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offers.findOne(id);
  }

  @Public()
  @Get('restaurant/:restaurantId')
  findByRestaurant(@Param('restaurantId') restaurantId: string) {
    return this.offers.findByRestaurant(restaurantId);
  }

  // AI assistant: draft an appetising title/description + suggested discount.
  @Post('assist')
  @Roles(Role.RESTAURANT_OWNER, Role.ADMIN)
  assist(@Body() dto: AssistOfferDto) {
    return this.ai.suggestOffer(dto);
  }

  @Post()
  @Roles(Role.RESTAURANT_OWNER, Role.ADMIN)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOfferDto) {
    return this.offers.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.RESTAURANT_OWNER, Role.ADMIN)
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateOfferDto) {
    return this.offers.update(id, user, dto);
  }

  @Delete(':id')
  @Roles(Role.RESTAURANT_OWNER, Role.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.offers.remove(id, user);
  }
}
