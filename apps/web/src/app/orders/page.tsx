'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Order } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { useAuth } from '@/store/auth';
import { ReviewForm } from '@/components/ReviewForm';
import { PickupQR } from '@/components/PickupQR';

const STATUS_STYLES: Record<string, string> = {
  RESERVED: 'bg-clay/15 text-clay',
  PAID: 'bg-olive/15 text-olive',
  PICKED_UP: 'bg-cocoa/15 text-cocoa',
  COMPLETED: 'bg-olive text-cream',
  CANCELLED: 'bg-sand text-muted',
};

export default function OrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();
  const [reviewingOrder, setReviewingOrder] = useState<string | null>(null);
  const [reviewedRestaurants, setReviewedRestaurants] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => apiFetch<Order[]>('/orders/mine'),
    enabled: !!user,
  });

  // When Stripe redirects back with ?session_id=..., verify it and mark paid.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (!sessionId) return;
    apiFetch('/orders/checkout/confirm', { method: 'POST', body: { sessionId } })
      .catch(() => {})
      .finally(() => {
        window.history.replaceState({}, '', '/orders');
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      });
  }, [queryClient]);

  // Redirect to Stripe Checkout for payment.
  const checkout = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ url: string }>(`/orders/${id}/checkout`, { method: 'POST' }),
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
    },
  });

  const action = useMutation({
    mutationFn: ({ id, verb }: { id: string; verb: 'complete' | 'cancel' }) =>
      apiFetch<Order>(`/orders/${id}/${verb}`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });

  if (isLoading) return <p className="py-32 text-center text-muted">Loading orders…</p>;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 lg:px-10">
      <p className="eyebrow">Your rescues</p>
      <h1 className="mt-3 font-display text-5xl font-medium tracking-tight text-ink">My orders</h1>

      {!orders || orders.length === 0 ? (
        <div className="mt-12 rounded-4xl border border-line bg-cream p-16 text-center">
          <p className="font-display text-2xl text-ink">No orders yet.</p>
          <p className="mt-2 text-sm text-muted">Your reserved meals will appear here.</p>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-3xl border border-line bg-cream p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-medium text-ink">{order.offer?.title}</h3>
                  <p className="mt-1 text-sm text-muted">{order.offer?.restaurant?.name}</p>
                  <p className="mt-3 text-sm text-cocoa">
                    {order.quantity} × · {formatPrice(order.totalPrice)} · Code{' '}
                    <span className="font-display font-semibold tracking-wide text-ink">
                      {order.pickupCode}
                    </span>
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                    STATUS_STYLES[order.status] ?? 'bg-sand text-muted'
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {order.status === 'RESERVED' && (
                  <>
                    <button
                      onClick={() => checkout.mutate(order.id)}
                      disabled={checkout.isPending}
                      className="btn-pill bg-ink px-5 py-2 text-cream hover:bg-espresso"
                    >
                      {checkout.isPending ? 'Redirecting…' : 'Pay now'}
                    </button>
                    <button
                      onClick={() => action.mutate({ id: order.id, verb: 'cancel' })}
                      disabled={action.isPending}
                      className="btn-pill border border-line px-5 py-2 text-muted hover:border-clay hover:text-clay"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {order.status === 'PICKED_UP' && (
                  <button
                    onClick={() => action.mutate({ id: order.id, verb: 'complete' })}
                    disabled={action.isPending}
                    className="btn-pill bg-olive px-5 py-2 text-cream hover:opacity-90"
                  >
                    Confirm received
                  </button>
                )}
                {order.status === 'COMPLETED' &&
                  order.offer?.restaurantId &&
                  (reviewedRestaurants.has(order.offer.restaurantId) ? (
                    <span className="text-sm text-olive">✓ Thanks for your review!</span>
                  ) : reviewingOrder !== order.id ? (
                    <button
                      onClick={() => setReviewingOrder(order.id)}
                      className="btn-pill border border-line px-5 py-2 text-ink hover:border-taupe"
                    >
                      ★ Leave a review
                    </button>
                  ) : null)}
              </div>

              {(order.status === 'PAID' || order.status === 'PICKED_UP') && (
                <PickupQR code={order.pickupCode} />
              )}

              {order.status === 'COMPLETED' &&
                reviewingOrder === order.id &&
                order.offer?.restaurantId && (
                  <ReviewForm
                    restaurantId={order.offer.restaurantId}
                    restaurantName={order.offer.restaurant?.name}
                    onCancel={() => setReviewingOrder(null)}
                    onDone={() => {
                      const rid = order.offer!.restaurantId!;
                      setReviewedRestaurants((prev) => new Set(prev).add(rid));
                      setReviewingOrder(null);
                    }}
                  />
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
