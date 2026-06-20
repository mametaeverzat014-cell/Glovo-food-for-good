'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { FoodCategory, Offer } from '@/lib/types';
import { ImageUpload } from './ImageUpload';

const CATEGORIES: FoodCategory[] = ['MEALS', 'BAKERY', 'GROCERY', 'DESSERTS', 'DRINKS', 'OTHER'];

/** Returns an ISO string N hours from now. */
function isoFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

const inputClass =
  'w-full rounded-2xl border border-line bg-paper px-4 py-2.5 text-sm text-ink focus:border-taupe focus:outline-none';

export function CreateOfferForm({ restaurantId }: { restaurantId: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    originalPrice: '',
    discountedPrice: '',
    quantity: '5',
    category: 'MEALS' as FoodCategory,
    pickupInHours: '2',
    windowHours: '3',
  });
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiHint, setAiHint] = useState<string | null>(null);

  interface Suggestion {
    title: string;
    description: string;
    suggestedDiscountPercent: number;
    suggestedDiscountedPrice?: number;
    reason: string;
  }

  const assist = useMutation({
    mutationFn: () =>
      apiFetch<Suggestion>('/offers/assist', {
        method: 'POST',
        body: {
          surplus: aiPrompt,
          category: form.category,
          originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
          quantity: form.quantity ? Number(form.quantity) : undefined,
          hoursUntilClose: form.pickupInHours ? Number(form.pickupInHours) : undefined,
        },
      }),
    onSuccess: (s) => {
      const original = Number(form.originalPrice);
      const price =
        s.suggestedDiscountedPrice ??
        (original ? Math.round(original * (1 - s.suggestedDiscountPercent / 100)) : undefined);
      setForm((f) => ({
        ...f,
        title: s.title,
        description: s.description,
        discountedPrice: price != null ? String(price) : f.discountedPrice,
      }));
      setAiHint(`${s.reason} (suggested −${s.suggestedDiscountPercent}%)`);
    },
    onError: (e) => setAiHint(e instanceof Error ? e.message : 'AI is unavailable right now'),
  });

  const create = useMutation({
    mutationFn: () => {
      const pickupStart = isoFromNow(Number(form.pickupInHours));
      const pickupEnd = isoFromNow(Number(form.pickupInHours) + Number(form.windowHours));
      return apiFetch<Offer>('/offers', {
        method: 'POST',
        body: {
          restaurantId,
          title: form.title,
          description: form.description || undefined,
          originalPrice: Number(form.originalPrice),
          discountedPrice: Number(form.discountedPrice),
          quantity: Number(form.quantity),
          category: form.category,
          pickupStart,
          pickupEnd,
          expiresAt: pickupEnd,
          images: image ? [image] : undefined,
        },
      });
    },
    onSuccess: () => {
      setForm((f) => ({ ...f, title: '', description: '', originalPrice: '', discountedPrice: '' }));
      setImage(null);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['restaurant-offers', restaurantId] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Could not create offer'),
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate();
      }}
      className="space-y-2.5 rounded-3xl border border-line bg-paper/60 p-5"
    >
      <p className="eyebrow">New surplus offer</p>
      {error && <p className="rounded-xl bg-clay/10 px-3 py-2 text-xs text-clay">{error}</p>}

      {/* AI assistant */}
      <div className="space-y-2 rounded-2xl border border-dashed border-olive/40 bg-olive/5 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-olive">
          ✨ AI assistant
        </p>
        <textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="What's left? e.g. 20 croissants and a few cakes, closing in 2h"
          rows={2}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => aiPrompt.trim().length >= 3 && assist.mutate()}
          disabled={assist.isPending || aiPrompt.trim().length < 3}
          className="btn-pill w-full bg-olive py-2 text-xs text-cream hover:opacity-90 disabled:opacity-50"
        >
          {assist.isPending ? 'Thinking…' : 'Generate title, description & discount'}
        </button>
        {aiHint && <p className="text-[11px] leading-snug text-cocoa">{aiHint}</p>}
      </div>

      <ImageUpload value={image} onChange={setImage} label="Dish photo" />

      <input
        placeholder="Title"
        required
        value={form.title}
        onChange={(e) => update('title', e.target.value)}
        className={inputClass}
      />
      <input
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => update('description', e.target.value)}
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-2.5">
        <input
          type="number"
          placeholder="Original ₸"
          required
          value={form.originalPrice}
          onChange={(e) => update('originalPrice', e.target.value)}
          className={inputClass}
        />
        <input
          type="number"
          placeholder="Discounted ₸"
          required
          value={form.discountedPrice}
          onChange={(e) => update('discountedPrice', e.target.value)}
          className={inputClass}
        />
        <input
          type="number"
          min={1}
          placeholder="Quantity"
          required
          value={form.quantity}
          onChange={(e) => update('quantity', e.target.value)}
          className={inputClass}
        />
        <select
          value={form.category}
          onChange={(e) => update('category', e.target.value)}
          className={inputClass}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="text-[11px] uppercase tracking-wider text-muted">
          Pickup in (h)
          <input
            type="number"
            min={0}
            value={form.pickupInHours}
            onChange={(e) => update('pickupInHours', e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="text-[11px] uppercase tracking-wider text-muted">
          Window (h)
          <input
            type="number"
            min={1}
            value={form.windowHours}
            onChange={(e) => update('windowHours', e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={create.isPending}
        className="btn-pill w-full bg-ink py-2.5 text-cream hover:bg-espresso disabled:opacity-60"
      >
        {create.isPending ? 'Publishing…' : 'Publish offer'}
      </button>
    </form>
  );
}
