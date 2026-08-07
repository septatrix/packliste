import type { PresetVariable } from '../lib/schema';

/**
 * Variable definitions "claimed" by more than one preset (see
 * `PresetDefinition.variables` in `lib/schema.ts`). Climate, mode of travel,
 * destination scope and gender used to be bespoke top-level `Params` fields;
 * they're really no different from a preset's own custom variable (e.g.
 * Sommerlager's "Rolle"), just used by several presets — nearly all of them,
 * for climate — instead of a single one.
 *
 * Every preset that reads one of these via `vars` in `resolveItems`/
 * `excludeItemIds` imports and lists the *same* definition object (same id,
 * same options) rather than redeclaring its own — the value is shared
 * globally by id (see `TripSelection.vars`), so claiming a variable a second
 * preset already claims doesn't create a second, independent value; it just
 * documents that this preset depends on it too.
 */
export const CLIMATE_VARIABLE: PresetVariable = {
  id: 'climate',
  label: 'Klima (mehrere möglich)',
  multi: true,
  options: [
    { value: 'warm', label: 'Warm' },
    { value: 'mild', label: 'Mild' },
    { value: 'kalt', label: 'Kalt' },
    { value: 'frostig', label: 'Frostig' },
  ],
  default: ['mild'],
};

export const TRAVEL_VARIABLE: PresetVariable = {
  id: 'travel',
  label: 'Verkehrsmittel',
  allowUnset: true,
  options: [
    { value: 'auto', label: 'Auto' },
    { value: 'bahn', label: 'Bahn' },
    { value: 'flugzeug', label: 'Flugzeug' },
  ],
  default: [],
};

export const DESTINATION_VARIABLE: PresetVariable = {
  id: 'destination',
  label: 'Reiseziel',
  allowUnset: true,
  options: [
    { value: 'inland', label: 'Inland' },
    { value: 'eu_schengen', label: 'EU / Schengen' },
    { value: 'international', label: 'International' },
  ],
  default: [],
};

export const GENDER_VARIABLE: PresetVariable = {
  id: 'gender',
  label: 'Geschlecht',
  allowUnset: true,
  options: [
    { value: 'divers', label: 'Divers' },
    { value: 'maennlich', label: 'Männlich' },
    { value: 'weiblich', label: 'Weiblich' },
  ],
  default: [],
};
