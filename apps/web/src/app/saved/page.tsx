'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Restaurant } from '@/lib/types';
import { useAuth } from '@/store/auth';

interface FavoriteItem {
  id: string;
  restaurantId: string;
  restaurant: Restaurant;
}

export default function SavedPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => apiFetch<FavoriteItem[]>('/favorites'),
    enabled: !!user,
  });

  if (isLoading) return <p className="py-32 text-center text-muted">Loading…</p>;

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
      <p className="eyebrow">Your kitchens</p>
      <h1 className="mt-3 font-display text-5xl font-medium tracking-tight text-ink">Saved</h1>

      {!data || data.length === 0 ? (
        <div className="mt-12 rounded-4xl border border-line bg-cream p-16 text-center">
          <p className="font-display text-2xl text-ink">Nothing saved yet.</p>
          <p className="mt-2 text-sm text-muted">
            Tap the ♡ on an offer to save its kitchen here.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map(({ restaurant }) => (
            <Link
              key={restaurant.id}
              href={`/restaurants/${restaurant.id}`}
              className="group flex items-center gap-4 rounded-3xl border border-line bg-cream p-5 transition hover:border-taupe"
            >
              {restaurant.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={restaurant.imageUrl}
                  alt={restaurant.name}
                  className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sand font-display text-2xl text-taupe">
                  ◍
                </div>
              )}
              <div className="min-w-0">
                <h3 className="truncate font-display text-lg font-medium text-ink group-hover:text-clay">
                  {restaurant.name}
                </h3>
                <p className="truncate text-sm text-muted">{restaurant.address}</p>
                <p className="mt-1 text-xs text-cocoa">⭐ {restaurant.rating.toFixed(1)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
