import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

/**
 * Thin wrapper around the Stripe SDK. The client is created lazily so the API
 * still boots when STRIPE_SECRET_KEY is not configured — payment endpoints then
 * return a clear error instead of crashing the app.
 */
@Injectable()
export class StripeService {
  private client: Stripe | null = null;

  constructor(private readonly config: ConfigService) {}

  get isConfigured(): boolean {
    return Boolean(this.config.get<string>('STRIPE_SECRET_KEY'));
  }

  get client_(): Stripe {
    if (!this.client) {
      const key = this.config.get<string>('STRIPE_SECRET_KEY');
      if (!key) {
        throw new ServiceUnavailableException(
          'Payments are not configured yet (STRIPE_SECRET_KEY is missing).',
        );
      }
      this.client = new Stripe(key);
    }
    return this.client;
  }
}
