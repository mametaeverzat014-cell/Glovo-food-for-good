'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Restaurant } from '@/lib/types';
import { useAuth } from '@/store/auth';
import { RestaurantPanel } from '@/components/RestaurantPanel';
import { ImageUpload } from '@/components/ImageUpload';
import { AddressAutocomplete, type GeoResult } from '@/components/AddressAutocomplete';

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    lat: '',
    lng: '',
    contactName: '',
    contactPhone: '',
  });
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddress = (r: GeoResult) =>
    setForm((f) => ({ ...f, address: r.label, lat: String(r.lat), lng: String(r.lng) }));

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
          description: form.description || undefined,
          address: form.address,
          lat: Number(form.lat),
          lng: Number(form.lng),
          imageUrl: image ?? undefined,
          contactName: form.contactName || undefined,
          contactPhone: form.contactPhone || undefined,
        },
      }),
    onSuccess: () => {
      setShowForm(false);
      setForm({ name: '', description: '', address: '', lat: '', lng: '', contactName: '', contactPhone: '' });
      setImage(null);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['my-restaurants'] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Could not submit application'),
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
          {showForm ? 'Close' : '+ New application'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.lat || !form.lng) {
              setError('Please pick an address from the suggestions so we can place it on the map.');
              return;
            }
            createRestaurant.mutate();
          }}
          className="mt-8 space-y-3 rounded-4xl border border-line bg-cream p-8"
        >
          <p className="eyebrow">Restaurant application</p>
          <p className="text-sm text-muted">
            Tell us about your restaurant. The FoodSave founder reviews every application before it
            goes live.
          </p>
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
          <textarea
            placeholder="Short description of your restaurant — cuisine, what surplus you usually have…"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-ink focus:border-taupe focus:outline-none"
          />
          <div>
            <AddressAutocomplete
              onSelect={handleAddress}
              placeholder="Address — e.g. Кабанбай батыр 17, Астана"
            />
            {form.lat && form.lng ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-olive">
                <span>✓</span> Pinned: {form.address}
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted">
                Start typing your address and pick it from the suggestions.
              </p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Owner / contact name"
              value={form.contactName}
              onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
              className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-ink focus:border-taupe focus:outline-none"
            />
            <input
              placeholder="Contact phone — e.g. +77011234567"
              value={form.contactPhone}
              onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
              className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-ink focus:border-taupe focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={createRestaurant.isPending}
            className="btn-pill bg-ink px-6 py-3 text-cream hover:bg-espresso disabled:opacity-60"
          >
            {createRestaurant.isPending ? 'Submitting…' : 'Submit application'}
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
