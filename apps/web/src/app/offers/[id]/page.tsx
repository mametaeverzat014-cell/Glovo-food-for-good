'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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

  if (isLoading)
    return <p className="py-32 text-center text-muted">Loading…</p>;
  if (!offer)
    return <p className="py-32 text-center text-muted">Offer not found.</p>;

  const image = offer.images?.[0] ?? offer.restaurant?.imageUrl;
  const soldOut = offer.quantity <= 0 || offer.status !== 'AVAILABLE';

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
      <Link href="/" className="eyebrow inline-flex items-center gap-2 hover:text-ink">
        ← Back to marketplace
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-4xl border border-line bg-sand">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={offer.title} className="aspect-[4/3] w-full object-cover" />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center font-display text-7xl text-taupe">
              ◍
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <p className="eyebrow">{categoryLabel(offer.category)}</p>
          <h1 className="mt-3 font-display text-5xl font-medium leading-[1.02] tracking-tight text-ink">
            {offer.title}
          </h1>
          <p className="mt-3 text-muted">{offer.restaurant?.name}</p>

          {offer.description && (
            <p className="mt-6 max-w-prose leading-relaxed text-cocoa">{offer.description}</p>
          )}

          <div className="mt-8 flex items-baseline gap-3">
            <span className="font-display text-5xl font-semibold text-ink">
              {formatPrice(offer.discountedPrice)}
            </span>
            <span className="text-lg text-muted line-through">
              {formatPrice(offer.originalPrice)}
            </span>
            <span className="rounded-full bg-clay px-3 py-1 text-sm font-semibold text-cream">
              −{offer.discountPercent}%
            </span>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line">
            <div className="bg-cream p-5">
              <dt className="eyebrow">Pickup window</dt>
              <dd className="mt-1 font-display text-lg text-ink">
                {formatPickupWindow(offer.pickupStart, offer.pickupEnd)}
              </dd>
            </div>
            <div className="bg-cream p-5">
              <dt className="eyebrow">Available</dt>
              <dd className="mt-1 font-display text-lg text-ink">{offer.quantity} portions</dd>
            </div>
          </dl>

          {error && (
            <p className="mt-6 rounded-2xl bg-clay/10 px-4 py-3 text-sm text-clay">{error}</p>
          )}

          <div className="mt-8">
            {!user ? (
              <button
                onClick={() => router.push('/login')}
                className="btn-pill w-full bg-ink py-4 text-cream hover:bg-espresso"
              >
                Sign in to reserve
              </button>
            ) : soldOut ? (
              <p className="rounded-2xl border border-line bg-cream py-4 text-center font-medium text-muted">
                Sold out
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={offer.quantity}
                  value={qty}
                  onChange={(e) =>
                    setQty(Math.max(1, Math.min(offer.quantity, Number(e.target.value))))
                  }
                  className="w-20 rounded-2xl border border-line bg-paper px-4 py-4 text-center text-ink focus:border-taupe focus:outline-none"
                />
                <button
                  onClick={() => reserve.mutate()}
                  disabled={reserve.isPending}
                  className="btn-pill flex-1 bg-ink py-4 text-cream hover:bg-espresso disabled:opacity-60"
                >
                  {reserve.isPending
                    ? 'Reserving…'
                    : `Reserve · ${formatPrice(Number(offer.discountedPrice) * qty)}`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
