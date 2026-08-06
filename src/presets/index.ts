import type { PresetDefinition } from '../lib/schema';
import base from './base';
import skifahren from './skifahren';
import wandern from './wandern';
import sommerlager from './sommerlager';
import camping from './camping';
import segeln from './segeln';
import motorrad from './motorrad';

export { base };

/** All selectable activity presets, always merged with `base`. */
export const activityPresets: PresetDefinition[] = [skifahren, wandern, sommerlager, camping, segeln, motorrad];

export function findActivityPreset(id: string): PresetDefinition | undefined {
  return activityPresets.find((preset) => preset.id === id);
}
