'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Analytics } from '@/lib/types';
import { formatCo2, formatPrice } from '@/lib/format';

export function RestaurantAnalytics({ restaurantId }: { restaurantId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', restaurantId],
    queryFn: () => apiFetch<Analytics>(`/analytics/restaurant/${restaurantId}`),
  });

  const stats = [
    { label: 'Meals saved', value: data ? String(data.mealsSaved) : '—' },
    { label: 'Recovered', value: data ? formatPrice(data.moneyRecovered) : '—' },
    { label: 'Saved for customers', value: data ? formatPrice(data.customerSavings) : '—' },
    { label: 'CO₂ avoided', value: data ? formatCo2(data.co2AvoidedKg) : '—' },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-cocoa p-5 text-cream">
          <p className="font-display text-2xl font-semibold sm:text-3xl">
            {isLoading ? '…' : s.value}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-sand/70">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
