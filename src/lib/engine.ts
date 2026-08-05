import type { Category, Importance, Item, ItemGender, Params, Preset, Quantity, When } from './schema';

export interface ResolvedItem {
  id: string;
  name: string;
  category: Category;
  importance: Importance;
  /** Human-readable quantity, e.g. "7", "1" or "1–2". */
  quantityLabel: string;
  quantityMin: number;
  quantityMax: number;
}

export interface ResolvedCategory {
  name: Category;
  items: ResolvedItem[];
}

/** Fixed display order for categories; unused categories are simply omitted. */
const CATEGORY_ORDER: Category[] = [
  'Dokumente',
  'Kleidung',
  'Hygiene',
  'Elektronik',
  'Ausrüstung',
  'Sonstiges',
];

/** All present `when` keys are ANDed; values within a key are ORed. */
export function matchesWhen(when: When | undefined, params: Params): boolean {
  if (!when) return true;
  if (when.climate && !when.climate.includes(params.climate)) return false;
  if (when.destination && !when.destination.includes(params.destination)) return false;
  if (when.travel && !when.travel.includes(params.travel)) return false;
  if (when.minDays !== undefined && params.days < when.minDays) return false;
  return true;
}

/** 'alle' always matches; otherwise the item gender list must contain the chosen gender. */
export function matchesGender(itemGender: ItemGender[], paramGender: Params['gender']): boolean {
  if (itemGender.includes('alle')) return true;
  if (paramGender === 'divers') return false;
  return itemGender.includes(paramGender);
}

function isFixedQuantity(q: Quantity): q is Extract<Quantity, { count: number }> {
  return 'count' in q;
}

export function computeQuantity(
  quantity: Quantity,
  days: number,
): { label: string; min: number; max: number } {
  const scale = (n: number) => (quantity.per === 'tag' ? n * days : n);
  const applyCap = (n: number) => (quantity.cap !== undefined ? Math.min(n, quantity.cap) : n);

  if (isFixedQuantity(quantity)) {
    const value = applyCap(scale(quantity.count));
    return { label: String(value), min: value, max: value };
  }

  const min = applyCap(scale(quantity.min));
  const max = applyCap(scale(quantity.max));
  return {
    label: min === max ? String(min) : `${min}–${max}`,
    min,
    max,
  };
}

/**
 * Merge the base preset with the chosen activity preset, filter by gender
 * and `when` conditions, compute display quantities, and group the result
 * by category in a fixed display order.
 */
export function resolveList(params: Params, base: Preset, preset: Preset): ResolvedCategory[] {
  const allItems: Item[] = [...base.items, ...preset.items];
  const byCategory = new Map<Category, ResolvedItem[]>();

  for (const item of allItems) {
    if (!matchesGender(item.gender, params.gender)) continue;
    if (!matchesWhen(item.when, params)) continue;

    const { label, min, max } = computeQuantity(item.quantity, params.days);
    const resolved: ResolvedItem = {
      id: item.id,
      name: item.name,
      category: item.category,
      importance: item.importance,
      quantityLabel: label,
      quantityMin: min,
      quantityMax: max,
    };

    const bucket = byCategory.get(item.category);
    if (bucket) {
      bucket.push(resolved);
    } else {
      byCategory.set(item.category, [resolved]);
    }
  }

  return CATEGORY_ORDER.filter((cat) => byCategory.has(cat)).map((cat) => ({
    name: cat,
    items: byCategory.get(cat)!,
  }));
}
