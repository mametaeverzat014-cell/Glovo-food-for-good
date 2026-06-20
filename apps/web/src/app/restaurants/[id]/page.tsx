'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Offer, Restaurant } from '@/lib/types';
import { OfferCard } from '@/components/OfferCard';

interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user?: { name: string };
}

type RestaurantDetail = Restaurant & {
  offers: Offer[];
  reviews: Review[];
};

/** Ensure each offer has the derived discount percent the card expects. */
function withDiscount(offer: Offer, restaurantName: string): Offer {
  const original = Number(offer.originalPrice);
  const discounted = Number(offer.discountedPrice);
  const discountPercent =
    offer.discountPercent ??
    (original > 0 ? Math.round(((original - discounted) / original) * 100) : 0);
  return { ...offer, discountPercent, restaurant: { id: offer.restaurantId, name: restaurantName, rating: 0 } };
}

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => apiFetch<RestaurantDetail>(`/restaurants/${id}`, { auth: false }),
  });

  if (isLoading) return <p className="py-32 text-center text-muted">Loading…</p>;
  if (!restaurant) return <p className="py-32 text-center text-muted">Restaurant not found.</p>;

  return (
    <div className="bg-paper">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <Link href="/map" className="eyebrow inline-flex items-center gap-2 hover:text-ink">
          ← Back to map
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-6 border-b border-line pb-10 sm:flex-row sm:items-end">
          <div className="flex items-start gap-6">
            {restaurant.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.imageUrl}
                alt={restaurant.name}
                className="h-24 w-24 shrink-0 rounded-3xl object-cover sm:h-28 sm:w-28"
              />
            )}
            <div>
            {restaurant.verified && (
              <span className="eyebrow text-olive">✓ Verified partner</span>
            )}
            <h1 className="mt-2 font-display text-5xl font-medium tracking-tight text-ink">
              {restaurant.name}
            </h1>
            <p className="mt-2 text-muted">{restaurant.address}</p>
            {restaurant.description && (
              <p className="mt-4 max-w-prose leading-relaxed text-cocoa">{restaurant.description}</p>
            )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-5xl font-semibold text-ink">
              {restaurant.rating.toFixed(1)}
            </p>
            <p className="eyebrow">{restaurant.reviewCount} reviews</p>
          </div>
        </div>

        <h2 className="mt-12 font-display text-3xl font-medium text-ink">Available now</h2>
        {restaurant.offers.length === 0 ? (
          <p className="mt-6 text-muted">No active offers right now — check back this evening.</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {restaurant.offers.map((offer) => (
              <OfferCard key={offer.id} offer={withDiscount(offer, restaurant.name)} />
            ))}
          </div>
        )}

        {restaurant.reviews.length > 0 && (
          <>
            <h2 className="mt-16 font-display text-3xl font-medium text-ink">What people say</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {restaurant.reviews.map((review) => (
                <div key={review.id} className="rounded-3xl border border-line bg-cream p-6">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-ink">{review.user?.name ?? 'Guest'}</p>
                    <span className="text-clay">{'★'.repeat(review.rating)}</span>
                  </div>
                  {review.comment && (
                    <p className="mt-3 text-sm leading-relaxed text-muted">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
