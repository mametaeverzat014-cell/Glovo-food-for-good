'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { StarRating } from './StarRating';

interface Props {
  restaurantId: string;
  restaurantName?: string;
  onDone: () => void;
  onCancel: () => void;
}

export function ReviewForm({ restaurantId, restaurantName, onDone, onCancel }: Props) {
  const [rating, setRating] = useState(0);
  const [foodQuality, setFoodQuality] = useState(0);
  const [value, setValue] = useState(0);
  const [pickupExperience, setPickup] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () =>
      apiFetch('/reviews', {
        method: 'POST',
        body: {
          restaurantId,
          rating,
          foodQuality: foodQuality || undefined,
          value: value || undefined,
          pickupExperience: pickupExperience || undefined,
          comment: comment.trim() || undefined,
        },
      }),
    onSuccess: () => onDone(),
    onError: (e) => setError(e instanceof Error ? e.message : 'Could not submit review'),
  });

  return (
    <div className="mt-4 rounded-2xl border border-line bg-paper p-5">
      <p className="eyebrow">Rate {restaurantName ?? 'this restaurant'}</p>

      <div className="mt-3 flex items-center gap-3">
        <span className="w-28 text-sm text-muted">Overall</span>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <div className="mt-3 space-y-2 border-t border-line pt-3">
        {[
          { label: 'Food quality', v: foodQuality, set: setFoodQuality },
          { label: 'Value', v: value, set: setValue },
          { label: 'Pickup', v: pickupExperience, set: setPickup },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <span className="w-28 text-sm text-muted">{row.label}</span>
            <StarRating value={row.v} onChange={row.set} size="text-lg" />
          </div>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Tell others about your experience (optional)"
        rows={3}
        className="mt-4 w-full rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-ink focus:border-taupe focus:outline-none"
      />

      {error && <p className="mt-3 rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {
            if (rating === 0) {
              setError('Please give an overall star rating.');
              return;
            }
            submit.mutate();
          }}
          disabled={submit.isPending}
          className="btn-pill bg-ink px-5 py-2 text-cream hover:bg-espresso disabled:opacity-60"
        >
          {submit.isPending ? 'Submitting…' : 'Submit review'}
        </button>
        <button
          onClick={onCancel}
          className="btn-pill border border-line px-5 py-2 text-muted hover:border-taupe"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
