import { z } from 'zod';
import { ItemSchema, type Category, type Importance, type Params, type PresetDefinition, type Quantity } from './schema';

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

function formatQuantity(quantity: Quantity): { label: string; min: number; max: number } {
  if (typeof quantity === 'number') {
    return { label: String(quantity), min: quantity, max: quantity };
  }
  const { min, max } = quantity;
  return { label: min === max ? String(min) : `${min}–${max}`, min, max };
}

/**
 * Run each preset's `resolveItems(params)`, validate the returned items
 * defensively, and group everything by category in a fixed display order.
 * All inclusion logic (gender, climate, destination, travel, per-day vs.
 * per-trip quantities, ...) already happened inside the presets themselves.
 */
export function resolveList(params: Params, presets: PresetDefinition[]): ResolvedCategory[] {
  const byCategory = new Map<Category, ResolvedItem[]>();

  for (const preset of presets) {
    let rawItems: unknown;
    try {
      rawItems = preset.resolveItems(params);
    } catch (err) {
      throw new Error(`Preset "${preset.id}" warf einen Fehler in resolveItems(): ${String(err)}`);
    }

    const items = z.array(ItemSchema).parse(rawItems);
    for (const item of items) {
      const { label, min, max } = formatQuantity(item.quantity);
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
  }

  return CATEGORY_ORDER.filter((cat) => byCategory.has(cat)).map((cat) => ({
    name: cat,
    items: byCategory.get(cat)!,
  }));
}
