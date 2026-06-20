const STEPS = [
  {
    n: '01',
    title: 'Discover',
    body: 'Browse surprise bags and discounted dishes from kitchens near you, updated as the day winds down.',
  },
  {
    n: '02',
    title: 'Reserve & pay',
    body: 'Lock in your rescue in seconds. Stock updates live, so what you see is what is left.',
  },
  {
    n: '03',
    title: 'Collect',
    body: 'Show your pickup code during the window, take your food, and enjoy a meal that would have been wasted.',
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-y border-line bg-cream">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <h2 className="max-w-md font-display text-4xl font-medium leading-tight tracking-tight text-ink sm:text-5xl">
            Three steps to a rescued meal.
          </h2>
          <p className="eyebrow max-w-xs sm:text-right">From kitchen surplus to your table in under a minute</p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-4xl border border-line bg-line sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.n} className="bg-cream p-8 transition-colors hover:bg-paper">
              <span className="font-display text-sm font-semibold text-clay">{step.n}</span>
              <h3 className="mt-6 font-display text-2xl font-medium text-ink">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
