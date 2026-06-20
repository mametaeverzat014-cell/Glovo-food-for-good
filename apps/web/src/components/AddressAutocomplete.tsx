'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';

export interface GeoResult {
  label: string;
  lat: number;
  lng: number;
}

interface Props {
  onSelect: (result: GeoResult) => void;
  placeholder?: string;
}

export function AddressAutocomplete({ onSelect, placeholder }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const justPicked = useRef(false);

  useEffect(() => {
    if (justPicked.current) {
      justPicked.current = false;
      return;
    }
    if (query.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const found = await apiFetch<GeoResult[]>('/geocoding/search', { params: { q: query } });
        setResults(found);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  const choose = (result: GeoResult) => {
    justPicked.current = true;
    setQuery(result.label);
    setResults([]);
    setOpen(false);
    onSelect(result);
  };

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder ?? 'Start typing the street, building…'}
        className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-ink focus:border-taupe focus:outline-none"
        autoComplete="off"
      />
      {loading && (
        <span className="absolute right-4 top-3.5 text-xs text-muted">…</span>
      )}

      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-2xl border border-line bg-cream shadow-lg">
          {results.map((result, i) => (
            <li key={`${result.lat}-${result.lng}-${i}`}>
              <button
                type="button"
                onClick={() => choose(result)}
                className="flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm text-ink hover:bg-paper"
              >
                <span className="mt-0.5 text-clay">📍</span>
                <span className="leading-snug">{result.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
