import type { PresetDefinition } from '../lib/schema';
import base from './base';
import skifahren from './skifahren';
import wandern from './wandern';
import sommerlager from './sommerlager';
import camping from './camping';
import segeln from './segeln';
import motorrad from './motorrad';

export { base };

/** All selectable activity presets, independent of whether `base` is also selected (see `allPresets`). */
export const activityPresets: PresetDefinition[] = [skifahren, wandern, sommerlager, camping, segeln, motorrad];

/**
 * Every preset a trip can include, `base` first — the canonical merge/
 * display order (see `resolveList()`'s "last preset wins" merge rule in
 * `lib/engine.ts`, which relies on `base` coming first). `base` is selected
 * by default but is otherwise an ordinary, uncheckable-like-any-other entry
 * in `TripSelection.presetIds` — nothing forces it in anymore.
 */
export const allPresets: PresetDefinition[] = [base, ...activityPresets];
