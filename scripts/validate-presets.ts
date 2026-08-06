/**
 * Catches preset authoring mistakes early: thrown exceptions, malformed
 * output (checked against ItemSchema), and item-id collisions between
 * presets — including between two *different* activity presets, now that a
 * trip can select several at once (see PackingApp.vue). Run via
 * `pnpm validate:presets`.
 *
 * Split into two passes for speed: which parameter *values* are active
 * doesn't change which item ids a preset can produce (ids are static
 * strings, not computed), so exhaustively crossing every preset *subset*
 * with the full parameter matrix is wasted work that would grow as
 * O(2^presets) forever. Instead:
 *   1. Every individual preset (merged with base) against the full
 *      parameter matrix — catches exceptions/malformed output.
 *   2. Every non-empty subset of presets against a handful of parameter
 *      profiles chosen to each turn on a different, maximal set of
 *      conditional items — catches id collisions between presets without
 *      re-running the full matrix for every subset.
 */
import { z } from 'zod';
import { ItemSchema, ParamsSchema, type Climate, type Params, type PresetDefinition } from '../src/lib/schema';
import { base, activityPresets } from '../src/presets';

function nonEmptySubsets<T>(items: T[]): T[][] {
  const subsets: T[][] = [];
  for (let mask = 1; mask < 1 << items.length; mask++) {
    subsets.push(items.filter((_, i) => mask & (1 << i)));
  }
  return subsets;
}

function allSubsets<T>(items: T[]): T[][] {
  return [[], ...nonEmptySubsets(items)];
}

const itemArraySchema = z.array(ItemSchema);
let errorCount = 0;

function resolveChecked(preset: PresetDefinition, params: Params, contextLabel: string): z.infer<typeof itemArraySchema> | undefined {
  let rawItems: unknown;
  try {
    rawItems = preset.resolveItems(params);
  } catch (err) {
    errorCount += 1;
    console.error(`Preset "${preset.id}" warf einen Fehler (${contextLabel}):`, err);
    return undefined;
  }

  const result = itemArraySchema.safeParse(rawItems);
  if (!result.success) {
    errorCount += 1;
    console.error(`Preset "${preset.id}" liefert ungültige Items (${contextLabel}):`, result.error.message);
    return undefined;
  }

  return result.data;
}

// --- Pass 1: full parameter matrix, one activity preset (+ base) at a time ---

const climateCombos: Climate[][] = allSubsets(['warm', 'mild', 'kalt', 'frostig']);
const travels: Params['travel'][] = ['auto', 'bahn', 'flugzeug', undefined];
const destinations: Params['destination'][] = ['inland', 'eu_schengen', 'international', undefined];
const genders: Params['gender'][] = ['divers', 'maennlich', 'weiblich', undefined];
const dayCounts = [1, 3, 7, 14];

let matrixCombinations = 0;

for (const preset of activityPresets) {
  for (const climate of climateCombos) {
    for (const travel of travels) {
      for (const destination of destinations) {
        for (const gender of genders) {
          for (const days of dayCounts) {
            matrixCombinations += 1;
            const candidate: Params = { presetIds: [preset.id], climate, travel, destination, gender, days };
            const parsedParams = ParamsSchema.safeParse(candidate);
            if (!parsedParams.success) {
              errorCount += 1;
              console.error(`Ungültige Test-Parameter für "${preset.id}":`, parsedParams.error.message);
              continue;
            }
            const params = parsedParams.data;
            const contextLabel = `params=${JSON.stringify(params)}`;
            resolveChecked(base, params, contextLabel);
            resolveChecked(preset, params, contextLabel);
          }
        }
      }
    }
  }
}

// --- Pass 2: every preset subset, against a handful of maximal-inclusion profiles ---

const collisionProfiles: Params[] = [
  { presetIds: [], climate: ['warm', 'mild', 'kalt', 'frostig'], travel: 'flugzeug', destination: 'international', gender: undefined, days: 14 },
  { presetIds: [], climate: ['warm', 'mild', 'kalt', 'frostig'], travel: 'flugzeug', destination: 'international', gender: 'maennlich', days: 14 },
  { presetIds: [], climate: ['warm', 'mild', 'kalt', 'frostig'], travel: 'flugzeug', destination: 'international', gender: 'weiblich', days: 14 },
  { presetIds: [], climate: [], travel: undefined, destination: undefined, gender: undefined, days: 1 },
];

const activityPresetCombos: PresetDefinition[][] = nonEmptySubsets(activityPresets);
let collisionChecks = 0;

for (const presets of activityPresetCombos) {
  for (const profile of collisionProfiles) {
    collisionChecks += 1;
    const presetIds = presets.map((p) => p.id);
    const params: Params = { ...profile, presetIds };
    const contextLabel = `presets=[${presetIds.join(', ')}], params=${JSON.stringify(params)}`;

    const seenIds = new Map<string, string>();
    for (const p of [base, ...presets]) {
      const items = resolveChecked(p, params, contextLabel);
      if (!items) continue;

      for (const item of items) {
        const existing = seenIds.get(item.id);
        if (existing) {
          errorCount += 1;
          console.error(`Doppelte Item-ID "${item.id}" in "${existing}" und "${p.id}" (${contextLabel})`);
        } else {
          seenIds.set(item.id, p.id);
        }
      }
    }
  }
}

const totalChecks = matrixCombinations + collisionChecks;
if (errorCount > 0) {
  console.error(`\n${errorCount} Fehler in ${totalChecks} Prüfungen gefunden.`);
  process.exit(1);
} else {
  console.log(
    `${activityPresets.length} Presets validiert: ${matrixCombinations} Parameterkombinationen (je einzeln) ` +
      `+ ${collisionChecks} Kollisionsprüfungen über ${activityPresetCombos.length} Preset-Teilmengen.`,
  );
}
