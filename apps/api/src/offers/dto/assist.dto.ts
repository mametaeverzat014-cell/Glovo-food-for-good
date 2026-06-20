import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';
import { FoodCategory } from '@prisma/client';

export class AssistOfferDto {
  @IsString()
  @MinLength(3)
  surplus!: string;

  @IsOptional()
  @IsEnum(FoodCategory)
  category?: FoodCategory;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  originalPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  hoursUntilClose?: number;
}
