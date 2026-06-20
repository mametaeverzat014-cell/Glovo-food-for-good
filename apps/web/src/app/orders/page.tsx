'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import type { Order } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { useAuth } from '@/store/auth';

const STATUS_STYLES: Record<string, string> = {
  RESERVED: 'bg-amber-100 text-amber-700',
  PAID: 'bg-blue-100 text-blue-700',
  PICKED_UP: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-slate-200 text-slate-500',
};

export default function OrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => apiFetch<Order[]>('/orders/mine'),
    enabled: !!user,
  });

  const action = useMutation({
    mutationFn: ({ id, verb }: { id: string; verb: 'pay' | 'complete' | 'cancel' }) =>
      apiFetch<Order>(`/orders/${id}/${verb}`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });

  if (isLoading) return <p className="py-12 text-center text-slate-400">Loading orders…</p>;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">My Orders</h1>
      {!orders || orders.length === 0 ? (
        <p className="py-12 text-center text-slate-400">You have no orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{order.offer?.title}</h3>
                  <p className="text-sm text-slate-500">{order.offer?.restaurant?.name}</p>
                  <p className="text-sm text-slate-500">
                    {order.quantity} × · {formatPrice(order.totalPrice)} · Code{' '}
                    <span className="font-mono font-semibold text-slate-700">{order.pickupCode}</span>
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    STATUS_STYLES[order.status] ?? 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                {order.status === 'RESERVED' && (
                  <>
                    <button
                      onClick={() => action.mutate({ id: order.id, verb: 'pay' })}
                      disabled={action.isPending}
                      className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
                    >
                      Pay now
                    </button>
                    <button
                      onClick={() => action.mutate({ id: order.id, verb: 'cancel' })}
                      disabled={action.isPending}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {order.status === 'PICKED_UP' && (
                  <button
                    onClick={() => action.mutate({ id: order.id, verb: 'complete' })}
                    disabled={action.isPending}
                    className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
                  >
                    Confirm received
                  </button>
                )}
                {order.status === 'PAID' && (
                  <p className="text-sm text-slate-500">
                    Show code <span className="font-mono">{order.pickupCode}</span> at pickup.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
