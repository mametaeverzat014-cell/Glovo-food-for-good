'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Offer, Order, Restaurant } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { CreateOfferForm } from './CreateOfferForm';

const ACTIVE_STATUSES = ['RESERVED', 'PAID', 'PICKED_UP'];

const STATUS_STYLES: Record<string, string> = {
  RESERVED: 'bg-clay/15 text-clay',
  PAID: 'bg-olive/15 text-olive',
  PICKED_UP: 'bg-cocoa/15 text-cocoa',
  COMPLETED: 'bg-olive text-cream',
  CANCELLED: 'bg-sand text-muted',
};

export function RestaurantPanel({ restaurant }: { restaurant: Restaurant }) {
  const queryClient = useQueryClient();

  const { data: offers } = useQuery({
    queryKey: ['restaurant-offers', restaurant.id],
    queryFn: () => apiFetch<Offer[]>(`/offers/restaurant/${restaurant.id}`, { auth: false }),
  });

  const { data: orders } = useQuery({
    queryKey: ['restaurant-orders', restaurant.id],
    queryFn: () => apiFetch<Order[]>(`/orders/restaurant/${restaurant.id}`),
  });

  const markPickedUp = useMutation({
    mutationFn: (orderId: string) =>
      apiFetch<Order>(`/orders/${orderId}/pickup`, { method: 'POST' }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['restaurant-orders', restaurant.id] }),
  });

  const activeOrders = (orders ?? []).filter((o) => ACTIVE_STATUSES.includes(o.status));

  return (
    <div className="rounded-4xl border border-line bg-cream p-8">
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-line pb-6">
        <div className="flex items-start gap-4">
          {restaurant.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={restaurant.imageUrl}
              alt={restaurant.name}
              className="h-14 w-14 shrink-0 rounded-2xl object-cover"
            />
          )}
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

      {/* Orders to hand over */}
      <div className="mt-8 border-t border-line pt-6">
        <p className="eyebrow mb-4">Orders to hand over</p>
        {activeOrders.length === 0 ? (
          <p className="text-sm text-muted">No active orders right now.</p>
        ) : (
          <ul className="space-y-2">
            {activeOrders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3"
              >
                <div className="text-sm">
                  <span className="font-medium text-ink">{order.offer?.title}</span>
                  <span className="text-muted"> · {order.user?.name ?? 'Customer'}</span>
                  <span className="ml-2 font-display font-semibold tracking-wide text-ink">
                    {order.pickupCode}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                      STATUS_STYLES[order.status] ?? 'bg-sand text-muted'
                    }`}
                  >
                    {order.status}
                  </span>
                  {order.status === 'PAID' && (
                    <button
                      onClick={() => markPickedUp.mutate(order.id)}
                      disabled={markPickedUp.isPending}
                      className="btn-pill bg-ink px-4 py-1.5 text-xs text-cream hover:bg-espresso disabled:opacity-60"
                    >
                      Mark handed over
                    </button>
                  )}
                  {order.status === 'RESERVED' && (
                    <span className="text-[11px] text-muted">awaiting payment</span>
                  )}
                  {order.status === 'PICKED_UP' && (
                    <span className="text-[11px] text-muted">awaiting confirmation</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
