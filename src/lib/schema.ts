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
    /**
     * Omit entirely for items where a count makes little sense because one
     * only ever owns a single one at a time (an ID card, a driver's
     * license, a wallet) — the UI then skips the amount input rather than
     * showing a meaningless "×1" stepper.
     */
    quantity: QuantitySchema.optional(),
    /** Optional single emoji for quick visual identification; falls back to a per-category icon. */
    icon: z.string().min(1).optional(),
    /**
     * Optional human-readable explanation of how `quantity` was computed
     * (e.g. "1 pro Tag × 7 Tage" or "gedeckelt bei 8") — shown in the info
     * icon's tooltip alongside the item's source preset. See `perDayNote`
     * in `presets/helpers.ts`.
     */
    note: z.string().min(1).optional(),
  })
  .strict();
export type Item = z.infer<typeof ItemSchema>;

/**
 * Runtime trip parameters consumed by presets/the engine. `days` is always
 * a plain number here — presets never deal with dates, only a day count
 * (see `TripSelection` below for what the user actually picks in the UI).
 *
 * `presetIds` is an array — a trip can combine several activities (e.g.
 * Skifahren *and* Sommerlager on the same vacation), so the resulting list
 * is the union of whatever each selected activity implies.
 *
 * Climate, mode of travel, destination scope and gender are *not* fields
 * here — they're ordinary claimed variables (see `PresetVariable` and
 * `presets/sharedVariables.ts`) passed alongside `Params` as `resolveItems`'
 * second argument, exactly like a preset's own custom variables (e.g.
 * Sommerlager's "Rolle"). They started out as bespoke fields here, but
 * there's nothing about them that a generic named, defaulted, "keine
 * Angabe"-capable value doesn't already cover — the only difference is that
 * several presets happen to claim the same one instead of just one.
 */
export const ParamsSchema = z
  .object({
    presetIds: z.array(z.string().min(1)),
    days: z.number().int().positive().max(365),
  })
  .strict();
export type Params = z.infer<typeof ParamsSchema>;

/**
 * A single choice a preset exposes to the user (e.g. "Rolle: Kind/Leiter:in",
 * or climate/travel/destination/gender — see `presets/sharedVariables.ts`)
 * beyond whatever's fixed on `Params`. A variable is identified only by its
 * `id`: two different presets declaring a variable with the same id *share*
 * one value (that's what "claiming" a variable means — see `TripSelection.vars`
 * below) rather than getting independent copies, which is how e.g. climate
 * ends up as one shared answer even though almost every preset claims it.
 *
 * `multi` renders the variable as a toggle-chip group instead of a
 * `<select>` and allows any number of options active at once (e.g. climate:
 * a trip can span several) instead of exactly zero-or-one. `allowUnset`
 * (single-select only; a multi-select is already unset by having nothing
 * toggled on) adds a "keine Angabe" empty option to the `<select>` — omit it
 * for a variable that should always have a concrete value, like Sommerlager's
 * "Rolle".
 *
 * `default` is used both as the initial value and as the fallback whenever a
 * trip selection predates this variable (or no currently active preset's
 * `variables` mentions it) — always an array, even for single-select
 * variables (`[]` for "keine Angabe", or a one-element array otherwise), so
 * the value shape doesn't depend on `multi`.
 */
export const PresetVariableOptionSchema = z.object({ value: z.string().min(1), label: z.string().min(1) }).strict();
export type PresetVariableOption = z.infer<typeof PresetVariableOptionSchema>;

export const PresetVariableSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    options: z.array(PresetVariableOptionSchema).min(1),
    multi: z.boolean().optional(),
    allowUnset: z.boolean().optional(),
    default: z.array(z.string().min(1)),
  })
  .strict();
export type PresetVariable = z.infer<typeof PresetVariableSchema>;

/** A packing preset: metadata plus the function that computes its items. */
export interface PresetDefinition {
  id: string;
  name: string;
  description?: string;
  /**
   * Variables this preset claims (see PresetVariable) — shown in the form
   * whenever this preset is active (`base` is always active, so its claimed
   * variables — climate, travel, destination, gender — are effectively
   * always shown, same as before they were variables at all). A preset
   * reading a variable via `vars` in `resolveItems`/`excludeItemIds` should
   * generally claim it too, even if some other active preset (usually
   * `base`) already does — claiming is what guarantees the control (and its
   * default) exists regardless of which other presets happen to be active.
   */
  variables?: PresetVariable[];
  /**
   * Every claimed variable's value, keyed by `PresetVariable.id` — shared
   * globally across all active presets (already defaulted, see `resolveVars`
   * in lib/engine.ts), not namespaced per preset. See `PresetVariableSchema`
   * for why: two presets claiming the same id intentionally see the same
   * value.
   */
  resolveItems(params: Params, vars: Record<string, string[]>): Item[];
  /**
   * Optional: item ids to drop from the *final*, already-merged list — the
   * only way a preset can affect an item contributed by a different preset
   * (e.g. Sommerlager removing the base preset's "Smartphone" for children).
   * Runs after every preset's resolveItems, so it doesn't matter which
   * preset originally added the id.
   */
  excludeItemIds?(params: Params, vars: Record<string, string[]>): string[];
}

export const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Erwartetes Format: JJJJ-MM-TT');

/**
 * What the user actually picks in `ParameterForm` and what gets persisted:
 * a start/end date instead of a raw day count. `deriveParams` turns this
 * into a `Params` object (with `days` computed) just before resolving the
 * list, so presets and the engine never need to know about dates.
 */
export const TripSelectionSchema = z
  .object({
    presetIds: z.array(z.string().min(1)),
    startDate: IsoDateSchema,
    endDate: IsoDateSchema,
    /**
     * Every claimed variable's value (see PresetVariable), keyed by variable
     * id — shared globally, not namespaced per preset, so presets claiming
     * the same id (e.g. "climate") see one another's value.
     */
    vars: z.record(z.string(), z.array(z.string())).default({}),
  })
  .strict()
  .refine((selection) => selection.endDate >= selection.startDate, {
    message: 'Abreisedatum darf nicht vor dem Anreisedatum liegen',
    path: ['endDate'],
  });
export type TripSelection = z.infer<typeof TripSelectionSchema>;

export const DEFAULT_TRIP_SELECTION: TripSelection = {
  presetIds: [],
  startDate: todayIso(),
  endDate: addDays(todayIso(), 6),
  vars: {
    climate: ['mild'],
    travel: ['auto'],
    destination: ['inland'],
    gender: ['divers'],
  },
};

export function deriveParams(selection: TripSelection): Params {
  const { startDate, endDate, vars: _vars, ...rest } = selection;
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
