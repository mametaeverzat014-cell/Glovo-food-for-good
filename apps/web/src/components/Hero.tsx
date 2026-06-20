import Link from 'next/link';
import { IMAGES } from '@/lib/images';

export function Hero() {
  return (
    <section className="grain relative isolate overflow-hidden bg-espresso">
      {/* Hero image */}
      <div className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMAGES.hero}
          alt="A table of rescued surplus food at golden hour"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-espresso/90 via-espresso/55 to-espresso/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-transparent to-espresso/30" />
      </div>

      <div className="mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-6 py-24 lg:px-10">
        <p className="eyebrow animate-fade-up text-sand/80">Whatever you crave, for less</p>

        <h1 className="mt-5 max-w-4xl animate-fade-up font-display text-[15vw] font-semibold leading-[0.92] tracking-tight text-cream sm:text-7xl lg:text-8xl">
          Rescue
          <br />
          the <span className="italic text-clay">feast.</span>
        </h1>

        <p className="mt-8 max-w-md animate-fade-up text-base leading-relaxed text-cream/80">
          The day&apos;s best dishes from local kitchens, bakeries and cafés — saved from the
          bin and offered to you at <span className="text-cream">50–70% off</span>. Good food,
          fair price, zero waste.
        </p>

        <div className="mt-10 flex animate-fade-up flex-wrap items-center gap-4">
          <Link href="#feed" className="btn-pill bg-cream text-ink hover:bg-sand">
            Browse today&apos;s rescues
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/register"
            className="btn-pill border border-cream/40 text-cream hover:bg-cream/10"
          >
            List your surplus
          </Link>
        </div>

        <dl className="mt-16 grid max-w-2xl animate-fade-up grid-cols-3 gap-8 border-t border-cream/15 pt-8">
          {[
            { v: '50–70%', k: 'Off every meal' },
            { v: '2.4 t', k: 'CO₂ avoided' },
            { v: '12K+', k: 'Meals rescued' },
          ].map((s) => (
            <div key={s.k}>
              <dt className="font-display text-3xl font-semibold text-cream sm:text-4xl">{s.v}</dt>
              <dd className="mt-1 text-[11px] uppercase tracking-widest text-sand/70">{s.k}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
