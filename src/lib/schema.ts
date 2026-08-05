import { z } from 'zod';

/**
 * Data model for packing-list presets and the runtime parameters that
 * control which items are included and in what quantity.
 *
 * Presets are plain YAML files (see public/presets/) validated against the
 * schemas below. There is deliberately no code execution here — every rule
 * a preset can express (conditions, quantities, gender filtering) is a
 * small declarative shape interpreted by src/lib/engine.ts.
 */

export const ClimateSchema = z.enum(['warm', 'mild', 'kalt', 'frostig']);
export type Climate = z.infer<typeof ClimateSchema>;

export const TravelSchema = z.enum(['auto', 'bahn', 'flugzeug']);
export type Travel = z.infer<typeof TravelSchema>;

export const DestinationSchema = z.enum(['inland', 'eu_schengen', 'international']);
export type Destination = z.infer<typeof DestinationSchema>;

/** Gender as selected by the user for the whole trip. */
export const ParamGenderSchema = z.enum(['divers', 'maennlich', 'weiblich']);
export type ParamGender = z.infer<typeof ParamGenderSchema>;

/** Gender an item is tagged with. 'alle' means the item applies regardless. */
export const ItemGenderSchema = z.enum(['alle', 'maennlich', 'weiblich']);
export type ItemGender = z.infer<typeof ItemGenderSchema>;

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

export const QuantityPerSchema = z.enum(['tag', 'reise']);
export type QuantityPer = z.infer<typeof QuantityPerSchema>;

/** A fixed quantity, e.g. "1 Paar Skihandschuhe" (per reise) or "1 Paar Socken" (per tag). */
const FixedQuantitySchema = z
  .object({
    count: z.number().int().positive(),
    per: QuantityPerSchema,
    cap: z.number().int().positive().optional(),
  })
  .strict();

/** A range quantity, e.g. "1–2 warme Muetzen". */
const RangeQuantitySchema = z
  .object({
    min: z.number().int().nonnegative(),
    max: z.number().int().positive(),
    per: QuantityPerSchema,
    cap: z.number().int().positive().optional(),
  })
  .strict()
  .refine((d) => d.max >= d.min, { message: 'max must be >= min' });

export const QuantitySchema = z.union([FixedQuantitySchema, RangeQuantitySchema]);
export type Quantity = z.infer<typeof QuantitySchema>;

/**
 * Conditions under which an item is included. All present keys are ANDed;
 * within a key, any listed value matches (OR). Absent keys impose no
 * restriction.
 */
export const WhenSchema = z
  .object({
    climate: z.array(ClimateSchema).min(1).optional(),
    destination: z.array(DestinationSchema).min(1).optional(),
    travel: z.array(TravelSchema).min(1).optional(),
    minDays: z.number().int().positive().optional(),
  })
  .strict();
export type When = z.infer<typeof WhenSchema>;

export const ItemSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    category: CategorySchema,
    importance: ImportanceSchema,
    gender: z.array(ItemGenderSchema).min(1).default(['alle']),
    quantity: QuantitySchema,
    when: WhenSchema.optional(),
  })
  .strict();
export type Item = z.infer<typeof ItemSchema>;

export const PresetSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    items: z.array(ItemSchema).min(1),
  })
  .strict();
export type Preset = z.infer<typeof PresetSchema>;

export const ManifestEntrySchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    file: z.string().min(1),
  })
  .strict();
export type ManifestEntry = z.infer<typeof ManifestEntrySchema>;

export const ManifestSchema = z
  .object({
    presets: z.array(ManifestEntrySchema).min(1),
  })
  .strict();
export type Manifest = z.infer<typeof ManifestSchema>;

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

/** State of a single checklist item as tracked by the user. */
export const ItemStateSchema = z.enum(['offen', 'eingepackt', 'nicht_benoetigt', 'morgen']);
export type ItemState = z.infer<typeof ItemStateSchema>;

export const ItemStateMapSchema = z.record(z.string(), ItemStateSchema);
export type ItemStateMap = z.infer<typeof ItemStateMapSchema>;
