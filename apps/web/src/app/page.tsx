'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { FeedFilters, FoodCategory, Offer } from '@/lib/types';
import { OfferCard } from '@/components/OfferCard';
import { Hero } from '@/components/Hero';
import { ImpactBand } from '@/components/ImpactBand';
import { HowItWorks } from '@/components/HowItWorks';

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

  const { data: offers, isLoading, isError } = useQuery({
    queryKey: ['offers', filters],
    queryFn: () =>
      apiFetch<Offer[]>('/offers', {
        auth: false,
        params: {
          category: filters.category,
          minDiscount: filters.minDiscount,
          sort: filters.sort,
        },
      }),
  });

  const toggleCategory = (value: FoodCategory) =>
    setFilters((f) => ({ ...f, category: f.category === value ? undefined : value }));

  return (
    <>
      <Hero />

      <section id="feed" className="bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
          <div className="flex flex-col justify-between gap-6 border-b border-line pb-8 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">The marketplace</p>
              <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">
                Today&apos;s rescues
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <label className="eyebrow">Sort by</label>
              <select
                value={filters.sort}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, sort: e.target.value as FeedFilters['sort'] }))
                }
                className="rounded-full border border-line bg-cream px-4 py-2 text-sm text-ink focus:border-taupe focus:outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilters((f) => ({ ...f, category: undefined }))}
              className={`rounded-full border px-4 py-1.5 text-[13px] uppercase tracking-wider transition-colors ${
                !filters.category
                  ? 'border-ink bg-ink text-cream'
                  : 'border-line bg-cream text-muted hover:border-taupe'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => toggleCategory(c.value)}
                className={`rounded-full border px-4 py-1.5 text-[13px] uppercase tracking-wider transition-colors ${
                  filters.category === c.value
                    ? 'border-ink bg-ink text-cream'
                    : 'border-line bg-cream text-muted hover:border-taupe'
                }`}
              >
                {c.label}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2">
              {[30, 50, 70].map((d) => (
                <button
                  key={d}
                  onClick={() =>
                    setFilters((f) => ({ ...f, minDiscount: f.minDiscount === d ? undefined : d }))
                  }
                  className={`rounded-full border px-4 py-1.5 text-[13px] transition-colors ${
                    filters.minDiscount === d
                      ? 'border-clay bg-clay text-cream'
                      : 'border-line bg-cream text-muted hover:border-clay'
                  }`}
                >
                  {d}%+ off
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="mt-12">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/5] animate-pulse rounded-3xl border border-line bg-sand/40"
                  />
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-4xl border border-line bg-cream p-16 text-center">
                <p className="font-display text-2xl text-ink">We couldn&apos;t reach the kitchen.</p>
                <p className="mt-2 text-sm text-muted">
                  The marketplace is taking a moment — please try again shortly.
                </p>
              </div>
            ) : !offers || offers.length === 0 ? (
              <div className="rounded-4xl border border-line bg-cream p-16 text-center">
                <p className="font-display text-3xl text-ink">No rescues match — yet.</p>
                <p className="mt-2 text-sm text-muted">
                  Adjust your filters, or check back this evening when kitchens post their surplus.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {offers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <ImpactBand />
      <HowItWorks />
    </>
  );
}
