import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

export interface OfferSuggestionInput {
  surplus: string;
  category?: string;
  originalPrice?: number;
  quantity?: number;
  hoursUntilClose?: number;
}

export interface OfferSuggestion {
  title: string;
  description: string;
  suggestedDiscountPercent: number;
  suggestedDiscountedPrice?: number;
  reason: string;
}

const SYSTEM_PROMPT = `You are a marketing copywriter and pricing advisor for FoodSave, a marketplace
in Kazakhstan where restaurants, cafes and bakeries sell their end-of-day surplus food at a discount
to reduce waste. Given a short note about what a kitchen has left over, you write one appetising,
honest offer and suggest a fair discount.

Rules:
- Titles are short (max 6 words), warm and appetising. No ALL CAPS, no emoji spam (one tasteful emoji ok).
- Descriptions are 1-2 friendly sentences a hungry customer would want to read.
- Suggested discount is one of 30, 50, or 70 (percent). Bigger discount when there is a lot left or
  little time before closing; smaller when scarce or premium.
- Prices are in Kazakhstani tenge (₸).
- Respond with ONLY a single minified JSON object and nothing else (no markdown, no code fences),
  with exactly these keys: "title" (string), "description" (string),
  "suggestedDiscountPercent" (number: 30, 50 or 70), "reason" (string, one short sentence).`;

@Injectable()
export class AiService {
  private client: Anthropic | null = null;

  constructor(private readonly config: ConfigService) {}

  get isConfigured(): boolean {
    return Boolean(this.config.get<string>('ANTHROPIC_API_KEY'));
  }

  private get anthropic(): Anthropic {
    if (!this.client) {
      const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
      if (!apiKey) {
        throw new ServiceUnavailableException(
          'The AI assistant is not configured yet (ANTHROPIC_API_KEY is missing).',
        );
      }
      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  async suggestOffer(input: OfferSuggestionInput): Promise<OfferSuggestion> {
    const details = [
      `Surplus: ${input.surplus}`,
      input.category ? `Category: ${input.category}` : null,
      input.originalPrice ? `Usual price: ${input.originalPrice} ₸` : null,
      input.quantity ? `Quantity left: ${input.quantity}` : null,
      input.hoursUntilClose ? `Hours until closing: ${input.hoursUntilClose}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const response = await this.anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: details }],
    });

    const text = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')
      .trim();

    const parsed = this.parseJson(text);

    const suggestedDiscountPercent = this.clampDiscount(parsed.suggestedDiscountPercent);
    const suggestedDiscountedPrice =
      input.originalPrice != null
        ? Math.round(input.originalPrice * (1 - suggestedDiscountPercent / 100))
        : undefined;

    return {
      title: String(parsed.title ?? '').trim() || 'Surprise rescue box',
      description: String(parsed.description ?? '').trim(),
      suggestedDiscountPercent,
      suggestedDiscountedPrice,
      reason: String(parsed.reason ?? '').trim(),
    };
  }

  /** Tolerantly extract the JSON object from the model's reply. */
  private parseJson(text: string): Record<string, unknown> {
    const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start !== -1 && end > start) {
        try {
          return JSON.parse(cleaned.slice(start, end + 1));
        } catch {
          /* fall through */
        }
      }
      return {};
    }
  }

  private clampDiscount(value: unknown): number {
    const n = Number(value);
    if (!Number.isFinite(n)) return 50;
    // Snap to the nearest of 30 / 50 / 70.
    return [30, 50, 70].reduce((best, d) => (Math.abs(d - n) < Math.abs(best - n) ? d : best), 50);
  }
}
