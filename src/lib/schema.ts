import { z } from 'zod';

/**
 * Shared types for packing-list presets.
 *
 * Presets are plain TS modules (see src/presets/) — each exports a
 * `resolveItems(params)` function containing whatever conditionals, loops,
 * or arithmetic the preset author needs (per-day quantities, gender
 * filtering, climate/destination/travel rules, ...). There is no
 * declarative rule DSL to interpret; the schemas below only describe the
 * runtime trip parameters and the *output* shape a preset must return,
 * which is validated defensively at resolve time.
 */

export const ClimateSchema = z.enum(['warm', 'mild', 'kalt', 'frostig']);
export type Climate = z.infer<typeof ClimateSchema>;

export const TravelSchema = z.enum(['auto', 'bahn', 'flugzeug']);
export type Travel = z.infer<typeof TravelSchema>;

export const DestinationSchema = z.enum(['inland', 'eu_schengen', 'international']);
export type Destination = z.infer<typeof DestinationSchema>;

export const ParamGenderSchema = z.enum(['divers', 'maennlich', 'weiblich']);
export type ParamGender = z.infer<typeof ParamGenderSchema>;

export const CategorySchema = z.enum([
  'Dokumente',
  'Kleidung',
  'Hygiene',
  'Elektronik',
  'Ausrüstung',
  'Sonstiges',
]);
export type Category = z.infer<typeof CategorySchema>;

export const ImportanceSchema = z.enum(['pflicht', 'optional']);
export type Importance = z.infer<typeof ImportanceSchema>;

/** Either a fixed count or a {min, max} range (e.g. "1–2 warme Muetzen"). */
export const QuantitySchema = z.union([
  z.number().int().positive(),
  z
    .object({ min: z.number().int().nonnegative(), max: z.number().int().positive() })
    .strict()
    .refine((d) => d.max >= d.min, { message: 'max must be >= min' }),
]);
export type Quantity = z.infer<typeof QuantitySchema>;

/**
 * Shape a preset's `resolveItems(params)` must return per item. The preset
 * function has already decided inclusion (gender, climate, destination, ...)
 * and computed the final quantity (e.g. `perDay(1, params.days)`) — this
 * schema only validates the result is well-formed.
 */
export const ItemSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    category: CategorySchema,
    importance: ImportanceSchema,
    quantity: QuantitySchema,
    /** Optional single emoji for quick visual identification; falls back to a per-category icon. */
    icon: z.string().min(1).optional(),
  })
  .strict();
export type Item = z.infer<typeof ItemSchema>;

/** Runtime trip parameters chosen by the user. */
export const ParamsSchema = z
  .object({
    presetId: z.string().min(1),
    climate: ClimateSchema,
    days: z.number().int().positive().max(365),
    travel: TravelSchema,
    destination: DestinationSchema,
    gender: ParamGenderSchema,
  })
  .strict();
export type Params = z.infer<typeof ParamsSchema>;

export const DEFAULT_PARAMS: Params = {
  presetId: '',
  climate: 'mild',
  days: 7,
  travel: 'auto',
  destination: 'inland',
  gender: 'divers',
};

/** A packing preset: metadata plus the function that computes its items. */
export interface PresetDefinition {
  id: string;
  name: string;
  description?: string;
  resolveItems(params: Params): Item[];
}

/** State of a single checklist item as tracked by the user. */
export const ItemStateSchema = z.enum(['offen', 'eingepackt', 'nicht_benoetigt', 'morgen']);
export type ItemState = z.infer<typeof ItemStateSchema>;

/**
 * Per-item user tracking: the four-way checklist state plus an editable
 * `amount` that overrides the preset's computed quantity suggestion (e.g.
 * the suggestion says "1–2", but the user decides to actually pack 1).
 */
export const ItemProgressSchema = z
  .object({
    state: ItemStateSchema,
    amount: z.number().int().nonnegative(),
  })
  .strict();
export type ItemProgress = z.infer<typeof ItemProgressSchema>;

export const ItemProgressMapSchema = z.record(z.string(), ItemProgressSchema);
export type ItemProgressMap = z.infer<typeof ItemProgressMapSchema>;
