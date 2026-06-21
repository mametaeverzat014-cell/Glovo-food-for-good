'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import type { Restaurant } from '@/lib/types';
import { useAuth } from '@/store/auth';

export default function InboxPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) router.push('/');
  }, [loading, user, router]);

  const { data: pending, isLoading } = useQuery({
    queryKey: ['pending-restaurants'],
    queryFn: () => apiFetch<Restaurant[]>('/restaurants/pending'),
    enabled: !!user && user.role === 'ADMIN',
  });

  const decide = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: 'approve' | 'reject'; reason?: string }) =>
      apiFetch(`/restaurants/${id}/${action}`, {
        method: 'PATCH',
        body: action === 'reject' ? { reason } : undefined,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-restaurants'] }),
  });

  if (isLoading) return <p className="py-32 text-center text-muted">Loading…</p>;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 lg:px-10">
      <p className="eyebrow">Founder</p>
      <h1 className="mt-3 font-display text-5xl font-medium tracking-tight text-ink">Inbox</h1>
      <p className="mt-2 text-muted">Review restaurant applications and decide who joins FoodSave.</p>

      {!pending || pending.length === 0 ? (
        <div className="mt-12 rounded-4xl border border-line bg-cream p-16 text-center">
          <p className="font-display text-2xl text-ink">No applications waiting.</p>
          <p className="mt-2 text-sm text-muted">New restaurant requests will appear here.</p>
        </div>
      ) : (
        <div className="mt-10 space-y-5">
          {pending.map((r) => (
            <div key={r.id} className="rounded-3xl border border-line bg-cream p-6">
              <div className="flex flex-col gap-5 sm:flex-row">
                {r.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.imageUrl}
                    alt={r.name}
                    className="h-28 w-28 shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-sand font-display text-3xl text-taupe">
                    ◍
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="font-display text-2xl font-medium text-ink">{r.name}</h3>
                  <p className="mt-1 text-sm text-muted">{r.address}</p>
                  {r.description && <p className="mt-3 text-sm text-cocoa">{r.description}</p>}

                  <dl className="mt-4 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
                    <div className="flex gap-2">
                      <dt className="text-muted">Owner:</dt>
                      <dd className="text-ink">{r.contactName || r.owner?.name || '—'}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted">Phone:</dt>
                      <dd className="text-ink">{r.contactPhone || r.owner?.phone || '—'}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted">Email:</dt>
                      <dd className="text-ink">{r.owner?.email || '—'}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted">Coordinates:</dt>
                      <dd className="text-ink">
                        {r.lat.toFixed(4)}, {r.lng.toFixed(4)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3 border-t border-line pt-4">
                <button
                  onClick={() => decide.mutate({ id: r.id, action: 'approve' })}
                  disabled={decide.isPending}
                  className="btn-pill bg-olive px-5 py-2 text-cream hover:opacity-90 disabled:opacity-60"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => {
                    const reason = window.prompt('Reason for rejection (optional):') ?? undefined;
                    decide.mutate({ id: r.id, action: 'reject', reason });
                  }}
                  disabled={decide.isPending}
                  className="btn-pill border border-line px-5 py-2 text-clay hover:bg-clay/5 disabled:opacity-60"
                >
                  Reject
                </button>
                <a
                  href={`/restaurants/${r.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-pill border border-line px-5 py-2 text-muted hover:border-taupe"
                >
                  Preview
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
