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
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">
            {restaurant.name}{' '}
            {restaurant.verified ? (
              <span className="text-xs text-brand">✓ verified</span>
            ) : (
              <span className="text-xs text-amber-500">pending verification</span>
            )}
          </h3>
          <p className="text-sm text-slate-500">{restaurant.address}</p>
        </div>
        <div className="text-right text-sm text-slate-500">
          ⭐ {restaurant.rating.toFixed(1)} ({restaurant.reviewCount})
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CreateOfferForm restaurantId={restaurant.id} />

        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">Active offers</h4>
          {!offers || offers.length === 0 ? (
            <p className="text-sm text-slate-400">No offers yet.</p>
          ) : (
            <ul className="space-y-2">
              {offers.map((offer) => (
                <li
                  key={offer.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span>
                    {offer.title}{' '}
                    <span className="text-xs text-slate-400">({offer.status})</span>
                  </span>
                  <span className="text-slate-600">
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
