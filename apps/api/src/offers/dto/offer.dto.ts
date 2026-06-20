import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Min,
  MinLength,
} from 'class-validator';
import { FoodCategory } from '@prisma/client';

export class CreateOfferDto {
  @IsString()
  restaurantId!: string;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  originalPrice!: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  discountedPrice!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsEnum(FoodCategory)
  category?: FoodCategory;

  @IsDateString()
  pickupStart!: string;

  @IsDateString()
  pickupEnd!: string;

  @IsDateString()
  expiresAt!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUrl({}, { each: true })
  images?: string[];
}

export class UpdateOfferDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  discountedPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsDateString()
  pickupStart?: string;

  @IsOptional()
  @IsDateString()
  pickupEnd?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export type OfferSort = 'nearest' | 'cheapest' | 'discount' | 'popular';

export class FeedQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  // Max distance in km (requires lat/lng).
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  maxDistanceKm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsEnum(FoodCategory)
  category?: FoodCategory;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minRating?: number;

  // Minimum discount percentage, e.g. 50 = at least 50% off.
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minDiscount?: number;

  @IsOptional()
  @IsEnum(['nearest', 'cheapest', 'discount', 'popular'])
  sort?: OfferSort;
}
