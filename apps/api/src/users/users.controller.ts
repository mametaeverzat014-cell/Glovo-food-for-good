import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // Admin-only directory of platform users.
  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.users.findAll();
  }
}
