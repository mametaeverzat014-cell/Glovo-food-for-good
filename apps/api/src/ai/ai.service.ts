import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
- Descriptions are 1-2 friendly, mouth-watering sentences a hungry customer would want to read.
- Suggested discount is one of 30, 50, or 70 (percent). Bigger discount when there is a lot left or
  little time before closing; smaller when scarce or premium.
- Prices are in Kazakhstani tenge.
- Respond with ONLY a single minified JSON object and nothing else (no markdown, no code fences),
  with exactly these keys: "title" (string), "description" (string),
  "suggestedDiscountPercent" (number: 30, 50 or 70), "reason" (string, one short sentence).`;

interface ChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

/**
 * Generates appetising offer copy + a suggested discount using xAI's Grok models
 * (OpenAI-compatible Chat Completions API at https://api.x.ai/v1).
 */
@Injectable()
export class AiService {
  constructor(private readonly config: ConfigService) {}

  get isConfigured(): boolean {
    return Boolean(this.config.get<string>('XAI_API_KEY'));
  }

  async suggestOffer(input: OfferSuggestionInput): Promise<OfferSuggestion> {
    const apiKey = this.config.get<string>('XAI_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'The AI assistant is not configured yet (XAI_API_KEY is missing).',
      );
    }
    const baseUrl = this.config.get<string>('XAI_BASE_URL') ?? 'https://api.x.ai/v1';
    const model = this.config.get<string>('XAI_MODEL') ?? 'grok-3';

    const details = [
      `Surplus: ${input.surplus}`,
      input.category ? `Category: ${input.category}` : null,
      input.originalPrice ? `Usual price: ${input.originalPrice} tenge` : null,
      input.quantity ? `Quantity left: ${input.quantity}` : null,
      input.hoursUntilClose ? `Hours until closing: ${input.hoursUntilClose}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    let data: ChatResponse;
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.8,
          max_tokens: 1024,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: details },
          ],
        }),
      });
      if (!res.ok) {
        throw new Error(`xAI responded ${res.status}`);
      }
      data = (await res.json()) as ChatResponse;
    } catch {
      throw new ServiceUnavailableException('The AI assistant is temporarily unavailable.');
    }

    const text = (data.choices?.[0]?.message?.content ?? '').trim();
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
    return [30, 50, 70].reduce((best, d) => (Math.abs(d - n) < Math.abs(best - n) ? d : best), 50);
  }
}
