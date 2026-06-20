import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-espresso text-cream">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <p className="font-display text-3xl font-semibold">FoodSave</p>
            <p className="mt-3 text-sm leading-relaxed text-sand/80">
              Good food was never meant for the bin. We connect kitchens with neighbours to
              rescue the surplus — beautifully, and for less.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 text-sm">
            <div>
              <p className="eyebrow text-sand/60">Explore</p>
              <ul className="mt-4 space-y-2 text-sand/90">
                <li>
                  <Link href="/" className="hover:text-cream">
                    Marketplace
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-cream">
                    For restaurants
                  </Link>
                </li>
                <li>
                  <Link href="/#impact" className="hover:text-cream">
                    Our impact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="eyebrow text-sand/60">Cities</p>
              <ul className="mt-4 space-y-2 text-sand/90">
                <li>Astana</li>
                <li>Almaty</li>
                <li className="text-sand/50">Shymkent — soon</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-cream/10 pt-6 text-xs text-sand/60 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} FoodSave — fighting food waste in Kazakhstan 🇰🇿</span>
          <span className="uppercase tracking-widest">Save food · Save money · Save the planet</span>
        </div>
      </div>
    </footer>
  );
}
