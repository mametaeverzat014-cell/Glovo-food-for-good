import { Role } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'phone must be a valid international number' })
  phone?: string;

  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  password!: string;

  // Only CUSTOMER or RESTAURANT_OWNER may self-register; ADMIN is provisioned manually.
  @IsOptional()
  @IsEnum(Role)
  role?: Extract<Role, 'CUSTOMER' | 'RESTAURANT_OWNER'>;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
