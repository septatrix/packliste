/**
 * Exercises every registered preset's resolveItems() across a matrix of
 * trip parameters to catch authoring mistakes early: thrown exceptions,
 * malformed output (checked against ItemSchema), and item-id collisions
 * between presets. Run via `pnpm validate:presets`.
 */
import { z } from 'zod';
import { ItemSchema, ParamsSchema, type Params } from '../src/lib/schema';
import { base, activityPresets } from '../src/presets';

// `undefined` ("keine Angabe") is included in every dimension so the
// validator also exercises each preset's unset-value handling.
const climates: Params['climate'][] = ['warm', 'mild', 'kalt', 'frostig', undefined];
const travels: Params['travel'][] = ['auto', 'bahn', 'flugzeug', undefined];
const destinations: Params['destination'][] = ['inland', 'eu_schengen', 'international', undefined];
const genders: Params['gender'][] = ['divers', 'maennlich', 'weiblich', undefined];
const dayCounts = [1, 3, 7, 14];

const itemArraySchema = z.array(ItemSchema);
let errorCount = 0;
let combinations = 0;

for (const preset of activityPresets) {
  for (const climate of climates) {
    for (const travel of travels) {
      for (const destination of destinations) {
        for (const gender of genders) {
          for (const days of dayCounts) {
            combinations += 1;
            const candidate: Params = { presetId: preset.id, climate, travel, destination, gender, days };
            const parsedParams = ParamsSchema.safeParse(candidate);
            if (!parsedParams.success) {
              errorCount += 1;
              console.error(`Ungültige Test-Parameter für "${preset.id}":`, parsedParams.error.message);
              continue;
            }
            const params = parsedParams.data;

            const seenIds = new Map<string, string>();
            for (const p of [base, preset]) {
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
  console.log(`Alle ${activityPresets.length} Presets über ${combinations} Parameterkombinationen erfolgreich validiert.`);
}
