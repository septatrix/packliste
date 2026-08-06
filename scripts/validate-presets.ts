/**
 * Exercises every combination of registered presets across a matrix of
 * trip parameters to catch authoring mistakes early: thrown exceptions,
 * malformed output (checked against ItemSchema), and item-id collisions —
 * including between two *different* activity presets now that a trip can
 * select several at once (see PackingApp.vue). Run via `pnpm validate:presets`.
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

// `undefined` ("keine Angabe") is included for travel/destination/gender so
// the validator also exercises each preset's unset-value handling. climate
// is tested as every possible subset (including the empty one), since it's
// now a multi-select array rather than a single value.
const activityPresetCombos: PresetDefinition[][] = nonEmptySubsets(activityPresets);
const climateCombos: Climate[][] = allSubsets(['warm', 'mild', 'kalt', 'frostig']);
const travels: Params['travel'][] = ['auto', 'bahn', 'flugzeug', undefined];
const destinations: Params['destination'][] = ['inland', 'eu_schengen', 'international', undefined];
const genders: Params['gender'][] = ['divers', 'maennlich', 'weiblich', undefined];
const dayCounts = [1, 3, 7, 14];

const itemArraySchema = z.array(ItemSchema);
let errorCount = 0;
let combinations = 0;

for (const presets of activityPresetCombos) {
  for (const climate of climateCombos) {
    for (const travel of travels) {
      for (const destination of destinations) {
        for (const gender of genders) {
          for (const days of dayCounts) {
            combinations += 1;
            const presetIds = presets.map((p) => p.id);
            const candidate: Params = { presetIds, climate, travel, destination, gender, days };
            const parsedParams = ParamsSchema.safeParse(candidate);
            if (!parsedParams.success) {
              errorCount += 1;
              console.error(`Ungültige Test-Parameter für [${presetIds.join(', ')}]:`, parsedParams.error.message);
              continue;
            }
            const params = parsedParams.data;

            const seenIds = new Map<string, string>();
            for (const p of [base, ...presets]) {
              let rawItems: unknown;
              try {
                rawItems = p.resolveItems(params);
              } catch (err) {
                errorCount += 1;
                console.error(`Preset "${p.id}" warf einen Fehler (params=${JSON.stringify(params)}):`, err);
                continue;
              }

              const result = itemArraySchema.safeParse(rawItems);
              if (!result.success) {
                errorCount += 1;
                console.error(
                  `Preset "${p.id}" liefert ungültige Items (params=${JSON.stringify(params)}):`,
                  result.error.message,
                );
                continue;
              }

              for (const item of result.data) {
                const existing = seenIds.get(item.id);
                if (existing) {
                  errorCount += 1;
                  console.error(
                    `Doppelte Item-ID "${item.id}" in "${existing}" und "${p.id}" (params=${JSON.stringify(params)})`,
                  );
                } else {
                  seenIds.set(item.id, p.id);
                }
              }
            }
          }
        }
      }
    }
  }
}

if (errorCount > 0) {
  console.error(`\n${errorCount} Fehler in ${combinations} Parameterkombinationen gefunden.`);
  process.exit(1);
} else {
  console.log(
    `Alle Kombinationen aus ${activityPresets.length} Presets (${activityPresetCombos.length} Teilmengen) über ${combinations} Parameterkombinationen erfolgreich validiert.`,
  );
}
