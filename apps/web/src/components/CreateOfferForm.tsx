'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { FoodCategory, Offer } from '@/lib/types';

const CATEGORIES: FoodCategory[] = ['MEALS', 'BAKERY', 'GROCERY', 'DESSERTS', 'DRINKS', 'OTHER'];

/** Returns an ISO string N hours from now, trimmed to minutes. */
function isoFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

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
  const [error, setError] = useState<string | null>(null);

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
        },
      });
    },
    onSuccess: () => {
      setForm((f) => ({ ...f, title: '', description: '', originalPrice: '', discountedPrice: '' }));
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
      className="space-y-2 rounded-lg border bg-slate-50 p-3"
    >
      <h4 className="text-sm font-semibold text-slate-700">New surplus offer</h4>
      {error && <p className="rounded bg-red-50 p-2 text-xs text-red-600">{error}</p>}

      <input
        placeholder="Title"
        required
        value={form.title}
        onChange={(e) => update('title', e.target.value)}
        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      />
      <input
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => update('description', e.target.value)}
        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          placeholder="Original price ₸"
          required
          value={form.originalPrice}
          onChange={(e) => update('originalPrice', e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        <input
          type="number"
          placeholder="Discounted price ₸"
          required
          value={form.discountedPrice}
          onChange={(e) => update('discountedPrice', e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        <input
          type="number"
          min={1}
          placeholder="Quantity"
          required
          value={form.quantity}
          onChange={(e) => update('quantity', e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        <select
          value={form.category}
          onChange={(e) => update('category', e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="text-xs text-slate-500">
          Pickup starts in (h)
          <input
            type="number"
            min={0}
            value={form.pickupInHours}
            onChange={(e) => update('pickupInHours', e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-slate-500">
          Window length (h)
          <input
            type="number"
            min={1}
            value={form.windowHours}
            onChange={(e) => update('windowHours', e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={create.isPending}
        className="w-full rounded-md bg-brand py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {create.isPending ? 'Publishing…' : 'Publish offer'}
      </button>
    </form>
  );
}
