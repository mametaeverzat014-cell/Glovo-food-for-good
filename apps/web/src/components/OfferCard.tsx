import Link from 'next/link';
import type { Offer } from '@/lib/types';
import { categoryLabel, formatPickupWindow, formatPrice } from '@/lib/format';

export function OfferCard({ offer }: { offer: Offer }) {
  const image = offer.images?.[0] ?? offer.restaurant?.imageUrl;

  return (
    <Link
      href={`/offers/${offer.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative h-40 w-full bg-slate-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={offer.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🍽️</div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">
          -{offer.discountPercent}%
        </span>
        <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-slate-700">
          {categoryLabel(offer.category)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="truncate">{offer.restaurant?.name}</span>
          {offer.distanceKm != null && <span>{offer.distanceKm} km</span>}
        </div>
        <h3 className="font-semibold text-slate-800 group-hover:text-brand">{offer.title}</h3>
        <p className="text-xs text-slate-500">
          Pickup {formatPickupWindow(offer.pickupStart, offer.pickupEnd)}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div>
            <span className="text-lg font-bold text-brand">{formatPrice(offer.discountedPrice)}</span>
            <span className="ml-1 text-xs text-slate-400 line-through">
              {formatPrice(offer.originalPrice)}
            </span>
          </div>
          <span className="text-xs text-slate-500">{offer.quantity} left</span>
        </div>
      </div>
    </Link>
  );
}
