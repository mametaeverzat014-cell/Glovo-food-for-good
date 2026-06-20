'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Offer } from '@/lib/types';
import { formatPrice } from '@/lib/format';

const inputClass =
  'w-full rounded-xl border border-line bg-cream px-3 py-2 text-sm text-ink focus:border-taupe focus:outline-none';

export function OfferRow({ offer, restaurantId }: { offer: Offer; restaurantId: string }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: offer.title,
    description: offer.description ?? '',
    discountedPrice: String(offer.discountedPrice),
    quantity: String(offer.quantity),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['restaurant-offers', restaurantId] });
    queryClient.invalidateQueries({ queryKey: ['analytics', restaurantId] });
  };

  const save = useMutation({
    mutationFn: () =>
      apiFetch(`/offers/${offer.id}`, {
        method: 'PATCH',
        body: {
          title: form.title,
          description: form.description || undefined,
          discountedPrice: Number(form.discountedPrice),
          quantity: Number(form.quantity),
        },
      }),
    onSuccess: () => {
      setEditing(false);
      setError(null);
      invalidate();
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Could not save'),
  });

  const remove = useMutation({
    mutationFn: () => apiFetch(`/offers/${offer.id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  if (editing) {
    return (
      <li className="space-y-2 rounded-2xl border border-line bg-paper p-3">
        {error && <p className="rounded-lg bg-clay/10 px-2 py-1.5 text-xs text-clay">{error}</p>}
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Title"
          className={inputClass}
        />
        <input
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Description"
          className={inputClass}
        />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] uppercase tracking-wider text-muted">
            Price ₸
            <input
              type="number"
              value={form.discountedPrice}
              onChange={(e) => setForm((f) => ({ ...f, discountedPrice: e.target.value }))}
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <label className="text-[11px] uppercase tracking-wider text-muted">
            Quantity
            <input
              type="number"
              min={0}
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              className={`mt-1 ${inputClass}`}
            />
          </label>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="btn-pill bg-ink px-4 py-1.5 text-xs text-cream hover:bg-espresso disabled:opacity-60"
          >
            {save.isPending ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setError(null);
            }}
            className="btn-pill border border-line px-4 py-1.5 text-xs text-muted hover:border-taupe"
          >
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3 text-sm">
      <span className="min-w-0 truncate text-ink">
        {offer.title}{' '}
        <span className="text-[11px] uppercase tracking-wider text-muted">· {offer.status}</span>
      </span>
      <div className="flex shrink-0 items-center gap-3">
        <span className="whitespace-nowrap text-cocoa">
          {formatPrice(offer.discountedPrice)} · {offer.quantity} left
        </span>
        {confirmDelete ? (
          <span className="flex items-center gap-1">
            <button
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
              className="rounded-full bg-clay px-3 py-1 text-[11px] font-medium text-cream"
            >
              {remove.isPending ? '…' : 'Delete'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-full border border-line px-3 py-1 text-[11px] text-muted"
            >
              No
            </button>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <button
              onClick={() => setEditing(true)}
              className="text-[11px] uppercase tracking-wider text-muted hover:text-ink"
            >
              Edit
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-[11px] uppercase tracking-wider text-muted hover:text-clay"
            >
              Delete
            </button>
          </span>
        )}
      </div>
    </li>
  );
}
