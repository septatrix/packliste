/**
 * Catches preset authoring mistakes early: thrown exceptions, malformed
 * output (checked against ItemSchema), accidental item-id collisions, and
 * runtime errors while merging presets together. Run via `pnpm validate:presets`.
 *
 * Two different presets returning an item with the *same* id is no longer
 * automatically an error — it's the convention for "this is genuinely the
 * same real-world thing" (see the `shared-` prefix and resolveList()'s
 * merge logic in src/lib/engine.ts), used deliberately by e.g. a shared
 * first-aid kit or sunscreen recommendation across multiple presets. So
 * this script checks two different things instead of one flat duplicate
 * check:
 *   1. Every individual preset (merged with base) against the full
 *      parameter matrix — catches exceptions/malformed output. Also
 *      records every id each preset can ever produce.
 *   2. A naming-convention check: any id *not* prefixed `shared-` must be
 *      globally unique across presets — otherwise resolveList() would
 *      silently (and likely wrongly) merge two unrelated items that just
 *      happened to collide by accident.
 *   3. resolveList() itself, across every non-empty subset of presets and
 *      a handful of parameter profiles chosen to each turn on a maximal
 *      set of conditional items — exercises the actual merge path
 *      (quantity/importance combination) for runtime errors, without
 *      re-running the full parameter matrix for every subset (which is
 *      unnecessary: which ids exist doesn't depend on the specific
 *      parameter values, only on which conditional branches are active).
 */
import { z } from 'zod';
import { ItemSchema, ParamsSchema, type Climate, type Params, type PresetDefinition } from '../src/lib/schema';
import { resolveList } from '../src/lib/engine';
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

// Every id each preset can ever produce, across all sampled parameters —
// used for the naming-convention check after Pass 1.
const idsByPreset = new Map<string, Set<string>>();

function recordAndValidate(preset: PresetDefinition, params: Params, contextLabel: string): void {
  let rawItems: unknown;
  try {
    rawItems = preset.resolveItems(params);
  } catch (err) {
    errorCount += 1;
    console.error(`Preset "${preset.id}" warf einen Fehler (${contextLabel}):`, err);
    return;
  }

  const result = itemArraySchema.safeParse(rawItems);
  if (!result.success) {
    errorCount += 1;
    console.error(`Preset "${preset.id}" liefert ungültige Items (${contextLabel}):`, result.error.message);
    return;
  }

  let idSet = idsByPreset.get(preset.id);
  if (!idSet) {
    idSet = new Set();
    idsByPreset.set(preset.id, idSet);
  }
  for (const item of result.data) idSet.add(item.id);
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
            recordAndValidate(base, params, contextLabel);
            recordAndValidate(preset, params, contextLabel);
          }
        }
      }
    }
  }
}

// --- Pass 2: naming-convention check ---
// An id outside the `shared-` namespace appearing in more than one preset
// is almost certainly an accidental collision, not an intentional shared
// item — resolveList() would merge it anyway, likely combining two
// unrelated things.

const owners = new Map<string, string>();
for (const [presetId, ids] of idsByPreset) {
  for (const id of ids) {
    if (id.startsWith('shared-')) continue;
    const existingOwner = owners.get(id);
    if (existingOwner && existingOwner !== presetId) {
      errorCount += 1;
      console.error(
        `Item-ID "${id}" (kein "shared-"-Präfix) wird sowohl von "${existingOwner}" als auch von "${presetId}" verwendet — ` +
          `entweder umbenennen oder absichtlich mit dem "shared-"-Präfix teilen.`,
      );
    } else {
      owners.set(id, presetId);
    }
  }
}

// --- Pass 3: exercise resolveList()'s merge path across preset subsets ---

const collisionProfiles: Params[] = [
  { presetIds: [], climate: ['warm', 'mild', 'kalt', 'frostig'], travel: 'flugzeug', destination: 'international', gender: undefined, days: 14 },
  { presetIds: [], climate: ['warm', 'mild', 'kalt', 'frostig'], travel: 'flugzeug', destination: 'international', gender: 'maennlich', days: 14 },
  { presetIds: [], climate: ['warm', 'mild', 'kalt', 'frostig'], travel: 'flugzeug', destination: 'international', gender: 'weiblich', days: 14 },
  { presetIds: [], climate: [], travel: undefined, destination: undefined, gender: undefined, days: 1 },
];

const activityPresetCombos: PresetDefinition[][] = nonEmptySubsets(activityPresets);
let mergeChecks = 0;

for (const presets of activityPresetCombos) {
  for (const profile of collisionProfiles) {
    mergeChecks += 1;
    const presetIds = presets.map((p) => p.id);
    const params: Params = { ...profile, presetIds };
    try {
      resolveList(params, [base, ...presets]);
    } catch (err) {
      errorCount += 1;
      console.error(`resolveList() warf einen Fehler für Presets [${presetIds.join(', ')}] (params=${JSON.stringify(params)}):`, err);
    }
  }
}

const totalChecks = matrixCombinations + mergeChecks;
if (errorCount > 0) {
  console.error(`\n${errorCount} Fehler in ${totalChecks} Prüfungen gefunden.`);
  process.exit(1);
} else {
  console.log(
    `${activityPresets.length} Presets validiert: ${matrixCombinations} Parameterkombinationen (je einzeln) ` +
      `+ Namenskonventions-Check + ${mergeChecks} Merge-Prüfungen über ${activityPresetCombos.length} Preset-Teilmengen.`,
  );
}
