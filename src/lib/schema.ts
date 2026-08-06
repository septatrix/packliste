import { z } from 'zod';
import { addDays, daysBetweenInclusive, todayIso } from './dates';

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

/**
 * Runtime trip parameters consumed by presets/the engine. `days` is always
 * a plain number here — presets never deal with dates, only a day count
 * (see `TripSelection` below for what the user actually picks in the UI).
 *
 * `presetIds` and `climate` are arrays — a trip can combine several
 * activities (e.g. Skifahren *and* Sommerlager on the same vacation) and
 * several climates (e.g. a country with both hot days and cold nights), so
 * the resulting list is the union of whatever each selected value implies.
 * An empty array means "keine Angabe" for climate, handled the same way as
 * `travel`/`destination` below (exclusive: `params.climate.includes(x)` is
 * already `false` for an empty array, no special-casing needed).
 *
 * `travel`/`destination`/`gender` are single, optional values — "keine
 * Angabe" (no selection) is a valid choice there too, and it's up to each
 * preset's `resolveItems` to decide what that means for its own
 * conditionals. There is no single universal rule: e.g. an unset `gender`
 * conventionally means "include every gender-specific variant" (a preset
 * author writes `matchesGender(params.gender, 'weiblich')`, see
 * `presets/helpers.ts`), while an unset `travel`/`destination` conventionally
 * means "include none of the conditional items for that dimension" — which
 * is already what a plain `params.travel === 'flugzeug'` check does for
 * `undefined`, with no extra handling needed.
 */
export const ParamsSchema = z
  .object({
    presetIds: z.array(z.string().min(1)),
    climate: z.array(ClimateSchema),
    days: z.number().int().positive().max(365),
    travel: TravelSchema.optional(),
    destination: DestinationSchema.optional(),
    gender: ParamGenderSchema.optional(),
  })
  .strict();
export type Params = z.infer<typeof ParamsSchema>;

/** A packing preset: metadata plus the function that computes its items. */
export interface PresetDefinition {
  id: string;
  name: string;
  description?: string;
  resolveItems(params: Params): Item[];
}

const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Erwartetes Format: JJJJ-MM-TT');

/**
 * What the user actually picks in `ParameterForm` and what gets persisted:
 * a start/end date instead of a raw day count. `deriveParams` turns this
 * into a `Params` object (with `days` computed) just before resolving the
 * list, so presets and the engine never need to know about dates.
 */
export const TripSelectionSchema = z
  .object({
    presetIds: z.array(z.string().min(1)),
    climate: z.array(ClimateSchema),
    startDate: IsoDateSchema,
    endDate: IsoDateSchema,
    travel: TravelSchema.optional(),
    destination: DestinationSchema.optional(),
    gender: ParamGenderSchema.optional(),
  })
  .strict()
  .refine((selection) => selection.endDate >= selection.startDate, {
    message: 'Abreisedatum darf nicht vor dem Anreisedatum liegen',
    path: ['endDate'],
  });
export type TripSelection = z.infer<typeof TripSelectionSchema>;

export const DEFAULT_TRIP_SELECTION: TripSelection = {
  presetIds: [],
  climate: ['mild'],
  startDate: todayIso(),
  endDate: addDays(todayIso(), 6),
  travel: 'auto',
  destination: 'inland',
  gender: 'divers',
};

export function deriveParams(selection: TripSelection): Params {
  const { startDate, endDate, ...rest } = selection;
  return { ...rest, days: daysBetweenInclusive(startDate, endDate) };
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
