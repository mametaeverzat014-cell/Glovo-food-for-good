'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Restaurant } from '@/lib/types';
import { useAuth } from '@/store/auth';
import { RestaurantPanel } from '@/components/RestaurantPanel';

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', lat: '51.1283', lng: '71.4304' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'RESTAURANT_OWNER' && user.role !== 'ADMIN'))) {
      router.push('/');
    }
  }, [loading, user, router]);

  const { data: restaurants, isLoading } = useQuery({
    queryKey: ['my-restaurants'],
    queryFn: () => apiFetch<Restaurant[]>('/restaurants/mine'),
    enabled: !!user,
  });

  const createRestaurant = useMutation({
    mutationFn: () =>
      apiFetch<Restaurant>('/restaurants', {
        method: 'POST',
        body: {
          name: form.name,
          address: form.address,
          lat: Number(form.lat),
          lng: Number(form.lng),
        },
      }),
    onSuccess: () => {
      setShowForm(false);
      setForm({ name: '', address: '', lat: '51.1283', lng: '71.4304' });
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['my-restaurants'] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Could not create restaurant'),
  });

  if (isLoading) return <p className="py-12 text-center text-slate-400">Loading dashboard…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Restaurant Dashboard</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          {showForm ? 'Close' : '+ Add restaurant'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createRestaurant.mutate();
          }}
          className="mb-6 space-y-2 rounded-xl border bg-white p-4"
        >
          {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
          <input
            placeholder="Restaurant name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Address"
            required
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Latitude"
              value={form.lat}
              onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Longitude"
              value={form.lng}
              onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={createRestaurant.isPending}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {createRestaurant.isPending ? 'Saving…' : 'Create restaurant'}
          </button>
        </form>
      )}

      {!restaurants || restaurants.length === 0 ? (
        <p className="py-12 text-center text-slate-400">
          No restaurants yet. Add one to start posting surplus offers.
        </p>
      ) : (
        <div className="space-y-4">
          {restaurants.map((r) => (
            <RestaurantPanel key={r.id} restaurant={r} />
          ))}
        </div>
      )}
    </div>
  );
}
