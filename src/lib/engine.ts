import { z } from 'zod';
import { ItemSchema, type Category, type Importance, type Params, type PresetDefinition, type Quantity } from './schema';

export interface ResolvedItem {
  id: string;
  name: string;
  category: Category;
  importance: Importance;
  icon: string;
  /** Human-readable quantity suggestion, e.g. "7", "1" or "1–2" — absent for singleton items (see Item.quantity). */
  quantityLabel?: string;
  quantityMin?: number;
  quantityMax?: number;
  /** Every preset that contributed to this item (usually one; more if merged, see resolveList). */
  sourceIds: string[];
  sourceNames: string[];
  /** Optional explanation of how quantityLabel was computed (see Item.note). */
  note?: string;
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

/** Used whenever a preset doesn't specify an item-level icon. */
const CATEGORY_ICONS: Record<Category, string> = {
  Dokumente: '📄',
  Kleidung: '👕',
  Hygiene: '🧴',
  Elektronik: '🔌',
  Ausrüstung: '🎒',
  Sonstiges: '📦',
};

function formatMinMax(min: number, max: number): string {
  return min === max ? String(min) : `${min}–${max}`;
}

function formatQuantity(quantity: Quantity): { label: string; min: number; max: number } {
  if (typeof quantity === 'number') {
    return { label: String(quantity), min: quantity, max: quantity };
  }
  const { min, max } = quantity;
  return { label: formatMinMax(min, max), min, max };
}

/**
 * Every claimed variable's value (see PresetVariable), defaulted from every
 * active preset's `variables` and overridden by whatever the user picked
 * (`varValues`, keyed by variable id — see `TripSelection.vars`) — so
 * `resolveItems`/`excludeItemIds` always see a complete map, even before the
 * user has touched the form (or for a trip selection saved before a variable
 * existed). Computed once per `resolveList()` call and passed unchanged to
 * every preset: two presets claiming the same id (e.g. "climate") are meant
 * to see the same value, not independent copies.
 */
function resolveVars(presets: PresetDefinition[], varValues: Record<string, string[]>): Record<string, string[]> {
  const defaults: Record<string, string[]> = {};
  for (const preset of presets) {
    for (const variable of preset.variables ?? []) {
      if (!(variable.id in defaults)) defaults[variable.id] = variable.default;
    }
  }
  return { ...defaults, ...varValues };
}

/**
 * Run each preset's `resolveItems(params)`, validate the returned items
 * defensively, and group everything by category in a fixed display order.
 * All inclusion logic (gender, climate, destination, travel, per-day vs.
 * per-trip quantities, ...) already happened inside the presets themselves.
 *
 * Two different presets are allowed — expected, even — to return an item
 * with the *same* id: that's the convention for "this is genuinely the
 * same real-world thing" (a shared first-aid kit, one bottle of
 * sunscreen, ...), by giving both items a `shared-...` id. Such items are
 * merged rather than duplicated: quantity is the elementwise max of both
 * suggestions (you don't need two first-aid kits just because two
 * activities each want one), importance is "pflicht" if either source
 * says so, and the later preset's name/icon/category/note win (later
 * presets are more activity-specific than `base`, which always resolves
 * first). The info icon then discloses every contributing preset.
 *
 * A single preset repeating its *own* id within one `resolveItems()` call
 * is a different situation — always an authoring mistake, never
 * intentional — and still throws.
 *
 * `varValues` holds the user's choice for every claimed variable (see
 * PresetVariable), keyed by variable id — e.g. climate, or Sommerlager's
 * "Rolle" (Kind/Leiter:in). It's passed to every preset's
 * `resolveItems`/`excludeItemIds` already defaulted, see `resolveVars`.
 */
export function resolveList(
  params: Params,
  presets: PresetDefinition[],
  varValues: Record<string, string[]> = {},
): ResolvedCategory[] {
  const merged = new Map<string, ResolvedItem>();
  const vars = resolveVars(presets, varValues);

  for (const preset of presets) {
    let rawItems: unknown;
    try {
      rawItems = preset.resolveItems(params, vars);
    } catch (err) {
      throw new Error(`Preset "${preset.id}" warf einen Fehler in resolveItems(): ${String(err)}`);
    }

    const items = z.array(ItemSchema).parse(rawItems);
    const seenInThisPreset = new Set<string>();

    for (const item of items) {
      if (seenInThisPreset.has(item.id)) {
        throw new Error(`Preset "${preset.id}" liefert die Item-ID "${item.id}" mehrfach in einem einzigen Aufruf.`);
      }
      seenInThisPreset.add(item.id);

      const quantity = item.quantity !== undefined ? formatQuantity(item.quantity) : undefined;
      const existing = merged.get(item.id);

      if (!existing) {
        merged.set(item.id, {
          id: item.id,
          name: item.name,
          category: item.category,
          importance: item.importance,
          icon: item.icon ?? CATEGORY_ICONS[item.category],
          quantityLabel: quantity?.label,
          quantityMin: quantity?.min,
          quantityMax: quantity?.max,
          sourceIds: [preset.id],
          sourceNames: [preset.name],
          note: item.note,
        });
        continue;
      }

      // A quantity-less item ("no amount makes sense here") stays
      // quantity-less even if merged with a source that did specify one —
      // it's a stronger assertion ("this isn't a countable thing") than
      // any specific number another preset happened to provide.
      const mergedQuantity =
        existing.quantityMin !== undefined && quantity !== undefined
          ? { min: Math.max(existing.quantityMin, quantity.min), max: Math.max(existing.quantityMax!, quantity.max) }
          : undefined;

      merged.set(item.id, {
        id: item.id,
        name: item.name,
        category: item.category,
        importance: existing.importance === 'pflicht' || item.importance === 'pflicht' ? 'pflicht' : 'optional',
        icon: item.icon ?? CATEGORY_ICONS[item.category],
        quantityLabel: mergedQuantity ? formatMinMax(mergedQuantity.min, mergedQuantity.max) : undefined,
        quantityMin: mergedQuantity?.min,
        quantityMax: mergedQuantity?.max,
        sourceIds: [...existing.sourceIds, preset.id],
        sourceNames: [...existing.sourceNames, preset.name],
        note: item.note ?? existing.note,
      });
    }
  }

  // Runs after every preset's items are merged, so a preset can drop an
  // item regardless of which preset (itself or another) originally added
  // it — e.g. Sommerlager removing "Smartphone" for children.
  for (const preset of presets) {
    if (!preset.excludeItemIds) continue;
    for (const id of preset.excludeItemIds(params, vars)) {
      merged.delete(id);
    }
  }

  const byCategory = new Map<Category, ResolvedItem[]>();
  for (const resolved of merged.values()) {
    const bucket = byCategory.get(resolved.category);
    if (bucket) {
      bucket.push(resolved);
    } else {
      byCategory.set(resolved.category, [resolved]);
    }
  }

  return CATEGORY_ORDER.filter((cat) => byCategory.has(cat)).map((cat) => ({
    name: cat,
    items: byCategory.get(cat)!,
  }));
}
