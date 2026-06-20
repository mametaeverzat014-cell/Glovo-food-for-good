'use client';

import { QRCodeSVG } from 'qrcode.react';

export function PickupQR({ code }: { code: string }) {
  return (
    <div className="mt-4 flex items-center gap-4 rounded-2xl border border-line bg-paper p-4">
      <div className="rounded-xl bg-cream p-2">
        <QRCodeSVG value={`FOODSAVE:${code}`} size={92} bgColor="#FAF6EE" fgColor="#211A14" />
      </div>
      <div>
        <p className="eyebrow">Show this at pickup</p>
        <p className="mt-1 font-display text-3xl font-semibold tracking-wide text-ink">{code}</p>
        <p className="mt-1 text-xs text-muted">The kitchen scans the code or matches it by eye.</p>
      </div>
    </div>
  );
}
