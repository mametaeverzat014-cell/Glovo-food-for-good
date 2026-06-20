'use client';

import { useRef, useState } from 'react';
import { uploadImage } from '@/lib/api';
import { resizeImage } from '@/lib/image';

interface Props {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  aspect?: 'wide' | 'square';
}

export function ImageUpload({ value, onChange, label = 'Photo', aspect = 'wide' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const resized = await resizeImage(file);
      const { url } = await uploadImage(resized);
      onChange(url);
    } catch {
      setError('Upload failed — try a smaller image.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const ratio = aspect === 'square' ? 'aspect-square' : 'aspect-[4/3]';

  return (
    <div>
      <span className="eyebrow mb-2 block">{label}</span>
      <div
        onClick={() => !busy && inputRef.current?.click()}
        className={`group relative ${ratio} w-full cursor-pointer overflow-hidden rounded-2xl border border-dashed border-line bg-paper transition hover:border-taupe`}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-ink/0 text-xs font-medium text-transparent transition group-hover:bg-ink/40 group-hover:text-cream">
              Change photo
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-muted">
            <span className="text-2xl">＋</span>
            <span className="text-xs">{busy ? 'Uploading…' : 'Add a photo'}</span>
          </div>
        )}
        {busy && <div className="absolute inset-0 animate-pulse bg-ink/10" />}
      </div>

      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-2 text-xs text-muted underline-offset-2 hover:text-clay hover:underline"
        >
          Remove
        </button>
      )}
      {error && <p className="mt-2 text-xs text-clay">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
