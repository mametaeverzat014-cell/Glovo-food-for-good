'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Analytics } from '@/lib/types';
import { formatCo2, formatCompact } from '@/lib/format';
import { IMAGES } from '@/lib/images';

export function ImpactBand() {
  const { data } = useQuery({
    queryKey: ['analytics', 'platform'],
    queryFn: () => apiFetch<Analytics>('/analytics/platform', { auth: false }),
  });

  const stats = [
    {
      value: data ? String(data.restaurants ?? 0) : '—',
      label: 'partner kitchens turning surplus into second servings.',
    },
    {
      value: data ? formatCompact(data.mealsSaved) : '—',
      label: 'meals rescued from the bin and onto a plate.',
    },
    {
      value: data ? formatCo2(data.co2AvoidedKg) : '—',
      label: 'of CO₂ emissions quietly avoided so far.',
    },
  ];

  return (
    <section id="impact" className="bg-paper">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <div className="max-w-3xl">
          <p className="eyebrow">Our impact</p>
          <h2 className="mt-4 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl">
            At <span className="italic">FoodSave</span>, less waste
            <br className="hidden sm:block" /> simply tastes better.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
            We believe surplus food is not leftovers — it&apos;s opportunity. Every evening,
            beautiful dishes go unsold. We make sure they find a table instead of a bin, so
            kitchens recover revenue and you eat well for less.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-12">
          <div className="overflow-hidden rounded-4xl lg:col-span-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={IMAGES.stillLife}
              alt="A warm still life of rescued bread and produce"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="grid grid-rows-3 lg:col-span-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`flex items-center justify-between gap-6 py-6 ${
                  i !== stats.length - 1 ? 'border-b border-line' : ''
                }`}
              >
                <p className="max-w-[14rem] text-sm leading-relaxed text-muted">{s.label}</p>
                <span className="font-display text-5xl font-semibold tabular-nums text-ink sm:text-6xl">
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col justify-between rounded-4xl bg-cocoa p-8 text-cream lg:col-span-3">
            <p className="font-display text-2xl font-medium leading-snug">
              Every order is a small act of repair.
            </p>
            <p className="mt-6 text-sm leading-relaxed text-sand/80">
              Quality food, fair pricing, and a measurably lighter footprint — that&apos;s the
              whole idea.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
