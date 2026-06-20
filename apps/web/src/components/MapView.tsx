'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import type { Restaurant } from '@/lib/types';

// Astana, fallback centre.
const DEFAULT_CENTER: [number, number] = [51.1283, 71.4304];

/** A small branded teardrop pin showing the count of active offers. */
function pin(count: number) {
  const label = count > 0 ? String(count) : '·';
  return L.divIcon({
    className: 'foodsave-pin',
    html: `
      <div style="
        position:relative;width:34px;height:34px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:#2C2219;border:2px solid #F3ECE0;
        box-shadow:0 6px 14px -4px rgba(44,34,25,0.6);
        display:flex;align-items:center;justify-content:center;">
        <span style="transform:rotate(45deg);color:#F3ECE0;font-size:12px;font-weight:600;">${label}</span>
      </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32],
  });
}

export default function MapView({ restaurants }: { restaurants: Restaurant[] }) {
  const center: [number, number] = restaurants.length
    ? [restaurants[0].lat, restaurants[0].lng]
    : DEFAULT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom
      className="h-[72vh] w-full overflow-hidden rounded-4xl border border-line"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {restaurants.map((r) => (
        <Marker key={r.id} position={[r.lat, r.lng]} icon={pin(r.activeOffers ?? 0)}>
          <Popup>
            <div className="min-w-[180px]">
              <p className="font-display text-base font-semibold text-ink">{r.name}</p>
              <p className="mt-0.5 text-xs text-muted">{r.address}</p>
              <p className="mt-2 text-xs text-cocoa">
                ⭐ {r.rating.toFixed(1)} · {r.activeOffers ?? 0} active offer
                {(r.activeOffers ?? 0) === 1 ? '' : 's'}
                {r.distanceKm != null ? ` · ${r.distanceKm} km` : ''}
              </p>
              <Link
                href={`/restaurants/${r.id}`}
                className="mt-3 inline-block rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-cream hover:bg-espresso"
              >
                View offers →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
