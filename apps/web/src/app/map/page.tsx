'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Restaurant } from '@/lib/types';

// Leaflet touches `window`, so the map renders on the client only.
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-[72vh] w-full animate-pulse rounded-4xl border border-line bg-sand/40" />
  ),
});

export default function MapPage() {
  const { data: restaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => apiFetch<Restaurant[]>('/restaurants', { auth: false }),
  });

  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <p className="eyebrow">Find a rescue near you</p>
        <h1 className="mt-3 font-display text-5xl font-medium tracking-tight text-ink">
          The map
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Every pin is a partner kitchen — the number shows how many surplus offers are live
          right now. Tap one to see what&apos;s on.
        </p>

        <div className="mt-10">
          <MapView restaurants={restaurants ?? []} />
        </div>
      </div>
    </section>
  );
}
