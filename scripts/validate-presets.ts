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
import { ItemSchema, ParamsSchema, type Params, type PresetDefinition, type PresetVariable } from '../src/lib/schema';
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

/** Every representative value a single claimed variable can take, e.g. `[]`/`['warm']`/`['warm','mild']`/… for a multi-select, or `[]`/`['auto']`/`['bahn']`/… for an optional single-select. */
function variableValueOptions(variable: PresetVariable): string[][] {
  if (variable.multi) return allSubsets(variable.options.map((option) => option.value));
  const singles = variable.options.map((option) => [option.value]);
  return variable.allowUnset ? [...singles, []] : singles;
}

/** Every combination of a set of claimed variables (deduped by id — two presets claiming the same variable share one axis, not two), fully specified — `[{}]` if there are none. */
function variableCombos(variables: PresetVariable[]): Record<string, string[]>[] {
  const byId = new Map<string, PresetVariable>();
  for (const variable of variables) if (!byId.has(variable.id)) byId.set(variable.id, variable);

  return [...byId.values()].reduce<Record<string, string[]>[]>(
    (combos, variable) => combos.flatMap((combo) => variableValueOptions(variable).map((value) => ({ ...combo, [variable.id]: value }))),
    [{}],
  );
}

const itemArraySchema = z.array(ItemSchema);
let errorCount = 0;

// Every id each preset can ever produce, across all sampled parameters —
// used for the naming-convention check after Pass 1.
const idsByPreset = new Map<string, Set<string>>();

function recordAndValidate(preset: PresetDefinition, params: Params, vars: Record<string, string[]>, contextLabel: string): void {
  let rawItems: unknown;
  try {
    rawItems = preset.resolveItems(params, vars);
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

const dayCounts = [1, 3, 7, 14];

let matrixCombinations = 0;

for (const preset of activityPresets) {
  // Every variable either `base` or this preset claims (deduped by id) —
  // covers climate/travel/destination/gender plus any preset-specific
  // variable like Sommerlager's "Rolle".
  const varCombos = variableCombos([...(base.variables ?? []), ...(preset.variables ?? [])]);

  for (const vars of varCombos) {
    for (const days of dayCounts) {
      matrixCombinations += 1;
      const candidate: Params = { presetIds: [preset.id], days };
      const parsedParams = ParamsSchema.safeParse(candidate);
      if (!parsedParams.success) {
        errorCount += 1;
        console.error(`Ungültige Test-Parameter für "${preset.id}":`, parsedParams.error.message);
        continue;
      }
      const params = parsedParams.data;
      const contextLabel = `params=${JSON.stringify(params)}, vars=${JSON.stringify(vars)}`;
      recordAndValidate(base, params, vars, contextLabel);
      recordAndValidate(preset, params, vars, contextLabel);
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

const collisionProfiles: { days: number; vars: Record<string, string[]> }[] = [
  { days: 14, vars: { climate: ['warm', 'mild', 'kalt', 'frostig'], travel: ['flugzeug'], destination: ['international'], gender: [] } },
  { days: 14, vars: { climate: ['warm', 'mild', 'kalt', 'frostig'], travel: ['flugzeug'], destination: ['international'], gender: ['maennlich'] } },
  { days: 14, vars: { climate: ['warm', 'mild', 'kalt', 'frostig'], travel: ['flugzeug'], destination: ['international'], gender: ['weiblich'] } },
  { days: 1, vars: { climate: [], travel: [], destination: [], gender: [] } },
];

const activityPresetCombos: PresetDefinition[][] = nonEmptySubsets(activityPresets);
let mergeChecks = 0;

for (const presets of activityPresetCombos) {
  for (const profile of collisionProfiles) {
    mergeChecks += 1;
    const presetIds = presets.map((p) => p.id);
    const params: Params = { presetIds, days: profile.days };
    try {
      resolveList(params, [base, ...presets], profile.vars);
    } catch (err) {
      errorCount += 1;
      console.error(`resolveList() warf einen Fehler für Presets [${presetIds.join(', ')}] (params=${JSON.stringify(params)}):`, err);
    }

    // Also exercise every combination of each included preset's own
    // variables (e.g. Sommerlager's "Rolle") — resolveList()'s merge and
    // cross-preset exclusion (excludeItemIds) both depend on them.
    for (const preset of presets) {
      const varCombos = variableCombos(preset.variables ?? []);
      if (varCombos.length <= 1) continue;
      for (const vars of varCombos) {
        mergeChecks += 1;
        try {
          resolveList(params, [base, ...presets], { ...profile.vars, ...vars });
        } catch (err) {
          errorCount += 1;
          console.error(
            `resolveList() warf einen Fehler für Presets [${presetIds.join(', ')}] mit ${preset.id}-vars=${JSON.stringify(vars)} (params=${JSON.stringify(params)}):`,
            err,
          );
        }
      }
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
