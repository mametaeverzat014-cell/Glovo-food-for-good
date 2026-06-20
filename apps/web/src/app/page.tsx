'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { FeedFilters, FoodCategory, Offer } from '@/lib/types';
import { OfferCard } from '@/components/OfferCard';

const CATEGORIES: { value: FoodCategory; label: string }[] = [
  { value: 'MEALS', label: 'Meals' },
  { value: 'BAKERY', label: 'Bakery' },
  { value: 'GROCERY', label: 'Grocery' },
  { value: 'DESSERTS', label: 'Desserts' },
  { value: 'DRINKS', label: 'Drinks' },
];

const SORTS = [
  { value: 'discount', label: 'Highest discount' },
  { value: 'cheapest', label: 'Cheapest' },
  { value: 'nearest', label: 'Nearest' },
  { value: 'popular', label: 'Most popular' },
] as const;

export default function MarketplacePage() {
  const [filters, setFilters] = useState<FeedFilters>({ sort: 'discount' });

  const { data: offers, isLoading } = useQuery({
    queryKey: ['offers', filters],
    queryFn: () =>
      apiFetch<Offer[]>('/offers', {
        auth: false,
        params: {
          category: filters.category,
          maxPrice: filters.maxPrice,
          minDiscount: filters.minDiscount,
          minRating: filters.minRating,
          sort: filters.sort,
          lat: filters.lat,
          lng: filters.lng,
        },
      }),
  });

  const toggleCategory = (value: FoodCategory) =>
    setFilters((f) => ({ ...f, category: f.category === value ? undefined : value }));

  return (
    <div>
      <section className="mb-6 rounded-2xl bg-brand-light p-6">
        <h1 className="text-2xl font-bold text-brand-dark">Rescue today&apos;s surplus food</h1>
        <p className="mt-1 text-slate-600">
          Great meals from local restaurants and bakeries at 50–70% off. Save money, save the planet.
        </p>
      </section>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => toggleCategory(c.value)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              filters.category === c.value
                ? 'border-brand bg-brand text-white'
                : 'border-slate-300 bg-white text-slate-600 hover:border-brand'
            }`}
          >
            {c.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-slate-500">Sort</label>
          <select
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as FeedFilters['sort'] }))}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={filters.minDiscount ?? ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                minDiscount: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
          >
            <option value="">Any discount</option>
            <option value="30">30%+ off</option>
            <option value="50">50%+ off</option>
            <option value="70">70%+ off</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-slate-400">Loading offers…</p>
      ) : !offers || offers.length === 0 ? (
        <p className="py-12 text-center text-slate-400">No offers match your filters right now.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  );
}
