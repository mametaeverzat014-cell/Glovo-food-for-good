import { Injectable } from '@nestjs/common';
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
  source: 'llm' | 'builtin';
}

const SYSTEM_PROMPT = `You are a marketing copywriter and pricing advisor for FoodSave, a marketplace
in Kazakhstan where restaurants, cafes and bakeries sell their end-of-day surplus food at a discount
to reduce waste. Given a short note about what a kitchen has left over, you write one appetising,
honest offer and suggest a fair discount.

Rules:
- WRITE THE "title", "description" AND "reason" IN RUSSIAN.
- Titles are short (max 6 words), warm and appetising. No ALL CAPS, no emoji spam (one tasteful emoji ok).
- Descriptions are 1-2 friendly, mouth-watering sentences a hungry customer would want to read.
- Suggested discount is one of 30, 50, or 70 (percent). Bigger discount when there is a lot left or
  little time before closing; smaller when scarce or premium.
- Respond with ONLY a single minified JSON object and nothing else (no markdown, no code fences),
  with exactly these keys: "title" (string), "description" (string),
  "suggestedDiscountPercent" (number: 30, 50 or 70), "reason" (string, one short sentence).`;

interface ChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

@Injectable()
export class AiService {
  constructor(private readonly config: ConfigService) {}

  get isConfigured(): boolean {
    return true; // the built-in generator always works
  }

  /**
   * Returns an appetising offer suggestion. Uses a free LLM (Groq, or any
   * OpenAI-compatible provider) when a key is configured, and always falls back
   * to a built-in generator so the feature works with zero setup.
   */
  async suggestOffer(input: OfferSuggestionInput): Promise<OfferSuggestion> {
    const provider = this.resolveProvider();
    if (provider) {
      try {
        return await this.viaLlm(input, provider);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[ai] LLM provider failed, using built-in generator:', err);
      }
    }
    return this.builtin(input);
  }

  // --- LLM path (optional) -------------------------------------------------

  private resolveProvider(): { baseUrl: string; apiKey: string; model: string } | null {
    const groqKey = this.config.get<string>('GROQ_API_KEY');
    if (groqKey) {
      return {
        baseUrl: 'https://api.groq.com/openai/v1',
        apiKey: groqKey,
        model: this.config.get<string>('GROQ_MODEL') ?? 'llama-3.3-70b-versatile',
      };
    }
    const xaiKey = this.config.get<string>('XAI_API_KEY');
    if (xaiKey) {
      return {
        baseUrl: this.config.get<string>('XAI_BASE_URL') ?? 'https://api.x.ai/v1',
        apiKey: xaiKey,
        model: this.config.get<string>('XAI_MODEL') ?? 'grok-3',
      };
    }
    return null;
  }

  private async viaLlm(
    input: OfferSuggestionInput,
    provider: { baseUrl: string; apiKey: string; model: string },
  ): Promise<OfferSuggestion> {
    const details = [
      `Surplus: ${input.surplus}`,
      input.category ? `Category: ${input.category}` : null,
      input.originalPrice ? `Usual price: ${input.originalPrice} tenge` : null,
      input.quantity ? `Quantity left: ${input.quantity}` : null,
      input.hoursUntilClose ? `Hours until closing: ${input.hoursUntilClose}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.model,
        temperature: 0.8,
        max_tokens: 512,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: details },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`provider ${res.status}: ${body.slice(0, 180)}`);
    }
    const data = (await res.json()) as ChatResponse;
    const parsed = this.parseJson(data.choices?.[0]?.message?.content ?? '');
    const pct = this.clampDiscount(parsed.suggestedDiscountPercent);
    return {
      title: String(parsed.title ?? '').trim() || this.builtin(input).title,
      description: String(parsed.description ?? '').trim() || this.builtin(input).description,
      suggestedDiscountPercent: pct,
      suggestedDiscountedPrice: this.discounted(input.originalPrice, pct),
      reason: String(parsed.reason ?? '').trim() || 'Предложено ИИ.',
      source: 'llm',
    };
  }

  // --- Built-in generator (no key, always works) ---------------------------

  private builtin(input: OfferSuggestionInput): OfferSuggestion {
    const item = this.cleanItem(input.surplus);

    const titleTemplates = [
      `${item} — спасём вместе`,
      `Бокс «${item}»`,
      `${item}: последний шанс`,
      `${item} в конце дня`,
      `Сюрприз-бокс «${item}»`,
    ];

    const closing =
      input.hoursUntilClose != null && input.hoursUntilClose <= 1
        ? 'Закрываемся совсем скоро, успейте забрать'
        : 'Заберите до закрытия сегодня вечером';

    // Phrased to avoid Russian adjective/gender agreement with the item name.
    const descTemplates = [
      `«${item}» — на вкус как только что с кухни, и уже ищет, кому достаться. ${closing} и заберите за часть цены. ♻️`,
      `Сегодня осталось: «${item}». Слишком вкусно, чтобы пропасть! ${closing} и сэкономьте, помогая планете.`,
      `Спасите «${item}» сегодня — тот же вкус, а цена куда приятнее. ${closing}.`,
      `Немного «${item}» осталось в конце дня. ${closing} и заберите со скидкой — еда не должна оказаться в мусоре.`,
    ];

    const { pct, reason } = this.suggestDiscount(input);

    return {
      title: this.trimWords(pick(titleTemplates), 7),
      description: pick(descTemplates),
      suggestedDiscountPercent: pct,
      suggestedDiscountedPrice: this.discounted(input.originalPrice, pct),
      reason,
      source: 'builtin',
    };
  }

  private suggestDiscount(input: OfferSuggestionInput): { pct: number; reason: string } {
    const qty = input.quantity ?? 0;
    const hours = input.hoursUntilClose ?? 3;
    if (qty >= 10 || hours <= 1) {
      return { pct: 70, reason: 'Осталось много или скоро закрытие — щедрая скидка.' };
    }
    if (qty >= 4 || hours <= 2) {
      return { pct: 50, reason: 'Честная скидка вдвое, чтобы разобрать остатки за день.' };
    }
    return { pct: 30, reason: 'Осталось немного, поэтому небольшая скидка.' };
  }

  // --- helpers -------------------------------------------------------------

  private cleanItem(surplus: string): string {
    const cleaned = surplus
      .replace(/[0-9]+/g, ' ')
      .replace(/\b(a|an|the|few|some|several|left|leftover|pieces?|portions?|of|and)\b/gi, ' ')
      .replace(/\b(несколько|немного|пара|остатки|остаток|штук|штуки|порц\w*|шт|и|ещё|еще)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const words = (cleaned || surplus).split(' ').filter(Boolean).slice(0, 4);
    return this.capitalize(words.join(' ')) || 'Сюрприз-бокс';
  }

  private trimWords(text: string, max: number): string {
    return text.split(' ').slice(0, max).join(' ');
  }

  private capitalize(text: string): string {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
  }

  private discounted(original: number | undefined, pct: number): number | undefined {
    return original != null ? Math.round(original * (1 - pct / 100)) : undefined;
  }

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
          /* ignore */
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
