'use client';

import { useState } from 'react';

interface Props {
  value: number;
  onChange?: (value: number) => void;
  size?: string;
  readOnly?: boolean;
}

export function StarRating({ value, onChange, size = 'text-2xl', readOnly = false }: Props) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => onChange?.(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className={`${size} leading-none transition-colors ${
            active >= n ? 'text-clay' : 'text-line'
          } ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
