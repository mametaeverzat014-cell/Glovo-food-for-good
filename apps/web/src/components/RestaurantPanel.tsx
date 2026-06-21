'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Offer, Order, Restaurant } from '@/lib/types';
import { CreateOfferForm } from './CreateOfferForm';
import { ImageUpload } from './ImageUpload';
import { AddressAutocomplete, type GeoResult } from './AddressAutocomplete';
import { RestaurantAnalytics } from './RestaurantAnalytics';
import { OfferRow } from './OfferRow';

const ACTIVE_STATUSES = ['RESERVED', 'PAID', 'PICKED_UP'];

const STATUS_STYLES: Record<string, string> = {
  RESERVED: 'bg-clay/15 text-clay',
  PAID: 'bg-olive/15 text-olive',
  PICKED_UP: 'bg-cocoa/15 text-cocoa',
  COMPLETED: 'bg-olive text-cream',
  CANCELLED: 'bg-sand text-muted',
};

const inputClass =
  'w-full rounded-2xl border border-line bg-paper px-4 py-3 text-ink focus:border-taupe focus:outline-none';

export function RestaurantPanel({ restaurant }: { restaurant: Restaurant }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({
    name: restaurant.name,
    description: restaurant.description ?? '',
    imageUrl: restaurant.imageUrl ?? null,
    address: restaurant.address,
    lat: String(restaurant.lat),
    lng: String(restaurant.lng),
  });

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

  const save = useMutation({
    mutationFn: () =>
      apiFetch<Restaurant>(`/restaurants/${restaurant.id}`, {
        method: 'PATCH',
        body: {
          name: edit.name,
          description: edit.description || undefined,
          imageUrl: edit.imageUrl ?? '',
          address: edit.address,
          lat: Number(edit.lat),
          lng: Number(edit.lng),
        },
      }),
    onSuccess: () => {
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['my-restaurants'] });
    },
  });

  const openEditor = () => {
    setEdit({
      name: restaurant.name,
      description: restaurant.description ?? '',
      imageUrl: restaurant.imageUrl ?? null,
      address: restaurant.address,
      lat: String(restaurant.lat),
      lng: String(restaurant.lng),
    });
    setEditing(true);
  };

  const handleAddress = (r: GeoResult) =>
    setEdit((e) => ({ ...e, address: r.label, lat: String(r.lat), lng: String(r.lng) }));

  const activeOrders = (orders ?? []).filter((o) => ACTIVE_STATUSES.includes(o.status));

  return (
    <div className="rounded-4xl border border-line bg-cream p-8">
      {editing ? (
        <div className="mb-6 space-y-3 border-b border-line pb-6">
          <p className="eyebrow">Edit restaurant</p>
          <div className="max-w-xs">
            <ImageUpload
              value={edit.imageUrl}
              onChange={(url) => setEdit((e) => ({ ...e, imageUrl: url }))}
              label="Restaurant photo"
            />
          </div>
          <input
            value={edit.name}
            onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))}
            placeholder="Restaurant name"
            className={inputClass}
          />
          <input
            value={edit.description}
            onChange={(e) => setEdit((s) => ({ ...s, description: e.target.value }))}
            placeholder="Short description (optional)"
            className={inputClass}
          />
          <div>
            <AddressAutocomplete onSelect={handleAddress} placeholder="Search a new address…" />
            <p className="mt-2 text-xs text-muted">
              Current: <span className="text-cocoa">{edit.address}</span>
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="btn-pill bg-ink px-5 py-2 text-cream hover:bg-espresso disabled:opacity-60"
            >
              {save.isPending ? 'Saving…' : 'Save changes'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="btn-pill border border-line px-5 py-2 text-muted hover:border-taupe"
            >
              Cancel
            </button>
            {save.isError && <span className="self-center text-xs text-clay">Could not save</span>}
          </div>
        </div>
      ) : (
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
                  restaurant.status === 'APPROVED'
                    ? 'bg-olive/15 text-olive'
                    : restaurant.status === 'REJECTED'
                      ? 'bg-clay/15 text-clay'
                      : 'bg-amber-100 text-amber-700'
                }`}
              >
                {restaurant.status === 'APPROVED'
                  ? '✓ Approved'
                  : restaurant.status === 'REJECTED'
                    ? 'Rejected'
                    : 'Pending review'}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="font-display text-2xl font-semibold text-ink">
                {restaurant.rating.toFixed(1)}
              </p>
              <p className="eyebrow">{restaurant.reviewCount} reviews</p>
            </div>
            <button
              onClick={openEditor}
              className="rounded-full border border-line px-4 py-1.5 text-xs text-muted hover:border-taupe hover:text-ink"
            >
              Edit
            </button>
          </div>
        </div>
      )}

      {restaurant.status !== 'APPROVED' && (
        <div
          className={`mb-6 rounded-3xl border p-5 text-sm ${
            restaurant.status === 'REJECTED'
              ? 'border-clay/30 bg-clay/5 text-clay'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          {restaurant.status === 'REJECTED' ? (
            <>
              <p className="font-medium">Application rejected.</p>
              {restaurant.rejectionReason && (
                <p className="mt-1">Reason: {restaurant.rejectionReason}</p>
              )}
              <p className="mt-1">You can edit the details and they will be reviewed again.</p>
            </>
          ) : (
            <>
              <p className="font-medium">⏳ Awaiting founder approval.</p>
              <p className="mt-1">
                You&apos;ll be able to publish offers once your application is approved.
              </p>
            </>
          )}
        </div>
      )}

      {!editing && restaurant.status === 'APPROVED' && (
        <RestaurantAnalytics restaurantId={restaurant.id} />
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {restaurant.status === 'APPROVED' ? (
          <CreateOfferForm restaurantId={restaurant.id} />
        ) : (
          <div className="rounded-3xl border border-dashed border-line bg-paper/60 p-5 text-sm text-muted">
            Offer publishing unlocks after approval.
          </div>
        )}

        <div>
          <p className="eyebrow mb-4">Active offers</p>
          {!offers || offers.length === 0 ? (
            <p className="text-sm text-muted">No offers yet.</p>
          ) : (
            <ul className="space-y-2">
              {offers.map((offer) => (
                <OfferRow key={offer.id} offer={offer} restaurantId={restaurant.id} />
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
