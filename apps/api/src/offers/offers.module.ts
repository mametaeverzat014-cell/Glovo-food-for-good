import { Module } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { AiService } from '../ai/ai.service';

@Module({
  controllers: [OffersController],
  providers: [OffersService, AiService],
  exports: [OffersService],
})
export class OffersModule {}
