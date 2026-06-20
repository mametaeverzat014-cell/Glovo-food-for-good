'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Restaurant } from '@/lib/types';
import { useAuth } from '@/store/auth';
import { RestaurantPanel } from '@/components/RestaurantPanel';
import { ImageUpload } from '@/components/ImageUpload';

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', lat: '51.1283', lng: '71.4304' });
  const [image, setImage] = useState<string | null>(null);
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
          imageUrl: image ?? undefined,
        },
      }),
    onSuccess: () => {
      setShowForm(false);
      setForm({ name: '', address: '', lat: '51.1283', lng: '71.4304' });
      setImage(null);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['my-restaurants'] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Could not create restaurant'),
  });

  if (isLoading) return <p className="py-32 text-center text-muted">Loading dashboard…</p>;

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
      <div className="flex flex-col justify-between gap-6 border-b border-line pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Partner dashboard</p>
          <h1 className="mt-3 font-display text-5xl font-medium tracking-tight text-ink">
            Your kitchens
          </h1>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="btn-pill bg-ink px-6 py-3 text-cream hover:bg-espresso"
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
          className="mt-8 space-y-3 rounded-4xl border border-line bg-cream p-8"
        >
          {error && <p className="rounded-2xl bg-clay/10 px-4 py-3 text-sm text-clay">{error}</p>}
          <div className="max-w-xs">
            <ImageUpload value={image} onChange={setImage} label="Restaurant photo" />
          </div>
          <input
            placeholder="Restaurant name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-ink focus:border-taupe focus:outline-none"
          />
          <input
            placeholder="Address"
            required
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-ink focus:border-taupe focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Latitude"
              value={form.lat}
              onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
              className="rounded-2xl border border-line bg-paper px-4 py-3 text-ink focus:border-taupe focus:outline-none"
            />
            <input
              placeholder="Longitude"
              value={form.lng}
              onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
              className="rounded-2xl border border-line bg-paper px-4 py-3 text-ink focus:border-taupe focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={createRestaurant.isPending}
            className="btn-pill bg-ink px-6 py-3 text-cream hover:bg-espresso disabled:opacity-60"
          >
            {createRestaurant.isPending ? 'Saving…' : 'Create restaurant'}
          </button>
        </form>
      )}

      {!restaurants || restaurants.length === 0 ? (
        <div className="mt-12 rounded-4xl border border-line bg-cream p-16 text-center">
          <p className="font-display text-2xl text-ink">No restaurants yet.</p>
          <p className="mt-2 text-sm text-muted">
            Add one to start posting surplus offers and tracking your impact.
          </p>
        </div>
      ) : (
        <div className="mt-10 space-y-6">
          {restaurants.map((r) => (
            <RestaurantPanel key={r.id} restaurant={r} />
          ))}
        </div>
      )}
    </div>
  );
}
