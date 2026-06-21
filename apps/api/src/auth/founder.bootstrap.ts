import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Ensures the platform founder (super-admin) account exists on every boot, so
 * restaurant applications always have a reviewer. Credentials are configurable
 * via FOUNDER_EMAIL / FOUNDER_PASSWORD.
 */
@Injectable()
export class FounderBootstrap implements OnApplicationBootstrap {
  private readonly logger = new Logger('FounderBootstrap');

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const email = (this.config.get<string>('FOUNDER_EMAIL') ?? 'erzat2009@bk.ru').toLowerCase();
    const password = this.config.get<string>('FOUNDER_PASSWORD') ?? '12345678';
    const name = this.config.get<string>('FOUNDER_NAME') ?? 'Erzat (Founder)';

    try {
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) {
        if (existing.role !== Role.ADMIN) {
          await this.prisma.user.update({ where: { email }, data: { role: Role.ADMIN } });
        }
        return;
      }
      await this.prisma.user.create({
        data: { name, email, passwordHash: await bcrypt.hash(password, 10), role: Role.ADMIN },
      });
      this.logger.log(`Founder account provisioned: ${email}`);
    } catch (err) {
      this.logger.error('Could not provision founder account', err as Error);
    }
  }
}
