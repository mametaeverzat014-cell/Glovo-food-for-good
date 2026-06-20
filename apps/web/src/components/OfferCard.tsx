import Link from 'next/link';
import type { Offer } from '@/lib/types';
import { categoryLabel, formatPickupWindow, formatPrice } from '@/lib/format';

export function OfferCard({ offer }: { offer: Offer }) {
  const image = offer.images?.[0] ?? offer.restaurant?.imageUrl;

  return (
    <Link href={`/offers/${offer.id}`} className="group block">
      <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-cream transition-all duration-500 hover:-translate-y-1 hover:border-taupe hover:shadow-[0_24px_60px_-32px_rgba(44,34,25,0.5)]">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={offer.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-5xl text-taupe">
              ◍
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink/40 to-transparent" />
          <span className="absolute left-4 top-4 rounded-full bg-cream/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cocoa">
            −{offer.discountPercent}%
          </span>
          <span className="absolute bottom-4 left-4 text-[11px] font-medium uppercase tracking-widest text-cream/90">
            {categoryLabel(offer.category)}
          </span>
          {offer.distanceKm != null && (
            <span className="absolute bottom-4 right-4 text-[11px] font-medium text-cream/90">
              {offer.distanceKm} km
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="eyebrow">{offer.restaurant?.name}</p>
          <h3 className="mt-1 font-display text-xl font-medium leading-snug text-ink transition-colors group-hover:text-clay">
            {offer.title}
          </h3>
          <p className="mt-2 text-xs text-muted">
            Pickup {formatPickupWindow(offer.pickupStart, offer.pickupEnd)}
          </p>

          <div className="mt-5 flex items-end justify-between border-t border-line pt-4">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-semibold text-ink">
                {formatPrice(offer.discountedPrice)}
              </span>
              <span className="text-xs text-muted line-through">
                {formatPrice(offer.originalPrice)}
              </span>
            </div>
            <span className="text-[11px] uppercase tracking-widest text-olive">
              {offer.quantity} left
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
