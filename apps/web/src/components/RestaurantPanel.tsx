'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Offer, Restaurant } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { CreateOfferForm } from './CreateOfferForm';

export function RestaurantPanel({ restaurant }: { restaurant: Restaurant }) {
  const { data: offers } = useQuery({
    queryKey: ['restaurant-offers', restaurant.id],
    queryFn: () => apiFetch<Offer[]>(`/offers/restaurant/${restaurant.id}`, { auth: false }),
  });

  return (
    <div className="rounded-4xl border border-line bg-cream p-8">
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <h3 className="font-display text-2xl font-medium text-ink">{restaurant.name}</h3>
          <p className="mt-1 text-sm text-muted">{restaurant.address}</p>
          <span
            className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-wider ${
              restaurant.verified ? 'bg-olive/15 text-olive' : 'bg-clay/15 text-clay'
            }`}
          >
            {restaurant.verified ? '✓ Verified' : 'Pending verification'}
          </span>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-semibold text-ink">
            {restaurant.rating.toFixed(1)}
          </p>
          <p className="eyebrow">{restaurant.reviewCount} reviews</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <CreateOfferForm restaurantId={restaurant.id} />

        <div>
          <p className="eyebrow mb-4">Active offers</p>
          {!offers || offers.length === 0 ? (
            <p className="text-sm text-muted">No offers yet.</p>
          ) : (
            <ul className="space-y-2">
              {offers.map((offer) => (
                <li
                  key={offer.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3 text-sm"
                >
                  <span className="text-ink">
                    {offer.title}{' '}
                    <span className="text-[11px] uppercase tracking-wider text-muted">
                      · {offer.status}
                    </span>
                  </span>
                  <span className="whitespace-nowrap text-cocoa">
                    {formatPrice(offer.discountedPrice)} · {offer.quantity} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
