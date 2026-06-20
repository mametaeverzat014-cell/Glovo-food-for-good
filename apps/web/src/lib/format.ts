export function formatPrice(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n) + ' ₸';
}

export function formatPickupWindow(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${fmt(start)} – ${fmt(end)}`;
}

const CATEGORY_LABELS: Record<string, string> = {
  MEALS: 'Meals',
  BAKERY: 'Bakery',
  GROCERY: 'Grocery',
  DESSERTS: 'Desserts',
  DRINKS: 'Drinks',
  OTHER: 'Other',
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}
