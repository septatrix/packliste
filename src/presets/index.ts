import type { PresetDefinition } from '../lib/schema';
import base from './base';
import skifahren from './skifahren';
import wandern from './wandern';
import sommerlager from './sommerlager';

export { base };

/** All selectable activity presets, always merged with `base`. */
export const activityPresets: PresetDefinition[] = [skifahren, wandern, sommerlager];

export function findActivityPreset(id: string): PresetDefinition | undefined {
  return activityPresets.find((preset) => preset.id === id);
}
