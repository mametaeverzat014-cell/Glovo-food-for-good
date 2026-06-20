'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Offer, Order } from '@/lib/types';
import { categoryLabel, formatPickupWindow, formatPrice } from '@/lib/format';
import { useAuth } from '@/store/auth';

export default function OfferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const { data: offer, isLoading } = useQuery({
    queryKey: ['offer', id],
    queryFn: () => apiFetch<Offer>(`/offers/${id}`, { auth: false }),
  });

  const reserve = useMutation({
    mutationFn: () =>
      apiFetch<Order>('/orders', { method: 'POST', body: { offerId: id, quantity: qty } }),
    onSuccess: () => router.push('/orders'),
    onError: (e) => setError(e instanceof Error ? e.message : 'Could not reserve'),
  });

  if (isLoading) return <p className="py-12 text-center text-slate-400">Loading…</p>;
  if (!offer) return <p className="py-12 text-center text-slate-400">Offer not found.</p>;

  const image = offer.images?.[0] ?? offer.restaurant?.imageUrl;
  const soldOut = offer.quantity <= 0 || offer.status !== 'AVAILABLE';

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="overflow-hidden rounded-xl border bg-white">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={offer.title} className="h-64 w-full object-cover" />
        ) : (
          <div className="flex h-64 items-center justify-center text-6xl">🍽️</div>
        )}
      </div>

      <div>
        <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand-dark">
          {categoryLabel(offer.category)}
        </span>
        <h1 className="mt-2 text-2xl font-bold">{offer.title}</h1>
        <p className="text-slate-500">{offer.restaurant?.name}</p>

        {offer.description && <p className="mt-3 text-slate-600">{offer.description}</p>}

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-brand">{formatPrice(offer.discountedPrice)}</span>
          <span className="text-slate-400 line-through">{formatPrice(offer.originalPrice)}</span>
          <span className="rounded-full bg-brand px-2 py-0.5 text-sm font-semibold text-white">
            -{offer.discountPercent}%
          </span>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          Pickup window: {formatPickupWindow(offer.pickupStart, offer.pickupEnd)}
        </p>
        <p className="text-sm text-slate-500">{offer.quantity} portions left</p>

        {error && <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 rounded-xl border bg-white p-4">
          {!user ? (
            <button
              onClick={() => router.push('/login')}
              className="w-full rounded-md bg-brand py-2 font-medium text-white hover:bg-brand-dark"
            >
              Sign in to reserve
            </button>
          ) : soldOut ? (
            <p className="text-center font-medium text-slate-500">Sold out</p>
          ) : (
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={offer.quantity}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Math.min(offer.quantity, Number(e.target.value))))}
                className="w-20 rounded-md border border-slate-300 px-3 py-2"
              />
              <button
                onClick={() => reserve.mutate()}
                disabled={reserve.isPending}
                className="flex-1 rounded-md bg-brand py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-60"
              >
                {reserve.isPending ? 'Reserving…' : `Reserve · ${formatPrice(Number(offer.discountedPrice) * qty)}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
