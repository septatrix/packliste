<script setup lang="ts">
import { computed } from 'vue';
import { daysBetweenInclusive } from '../lib/dates';
import type { PresetVariable, TripSelection } from '../lib/schema';

type PresetOption = { id: string; name: string; description?: string; variables?: PresetVariable[] };

const props = defineProps<{
  modelValue: TripSelection;
  /** `base` — rendered as its own toggle, separate from the activity group, since it's not an "activity" but is (like any of them) just an entry in `presetIds` the user can check/uncheck. Selected by default (see `PackingApp.vue`). */
  baseOption: PresetOption;
  activityOptions: PresetOption[];
  /** Ids of variables that render in their own top-level field (see `presets/sharedVariables.ts`) rather than grouped under whichever preset claims them, e.g. climate/travel/destination/gender. Shown whenever any currently active preset (base or an activity) claims them — not shown at all if none do. */
  globalVariableIds?: string[];
}>();
const emit = defineEmits<{ 'update:modelValue': [value: TripSelection] }>();

const allOptions = computed(() => [props.baseOption, ...props.activityOptions]);

// Every preset (base or activity) is toggled the same way — a trip can
// combine several activities (e.g. Skifahren *and* Sommerlager) and base is
// no different, just usually on by default.
function togglePresetId(id: string) {
  const current = props.modelValue.presetIds;
  const next = current.includes(id) ? current.filter((existing) => existing !== id) : [...current, id];
  emit('update:modelValue', { ...props.modelValue, presetIds: next });
}

const selectedDescriptions = computed(() =>
  props.activityOptions.filter((preset) => props.modelValue.presetIds.includes(preset.id)).map((preset) => preset.description),
);

// Every claimed variable (see PresetVariable) is stored flat by id in
// `modelValue.vars`, shared across whichever presets claim it — a single-
// select's value is a zero-or-one-element array, a multi-select's is
// zero-or-more.
function varValue(variable: PresetVariable): string[] {
  return props.modelValue.vars[variable.id] ?? variable.default;
}

function setVar(variableId: string, value: string[]) {
  emit('update:modelValue', { ...props.modelValue, vars: { ...props.modelValue.vars, [variableId]: value } });
}

function toggleMultiVar(variable: PresetVariable, value: string) {
  const current = varValue(variable);
  const next = current.includes(value) ? current.filter((existing) => existing !== value) : [...current, value];
  setVar(variable.id, next);
}

// Native <select> values are always strings, so the empty "Keine Angabe"
// option is represented as '' in the DOM and converted to/from `[]` here.
function singleVarValue(variable: PresetVariable): string {
  return varValue(variable)[0] ?? '';
}

function setSingleVar(variable: PresetVariable, value: string) {
  setVar(variable.id, value === '' ? [] : [value]);
}

const globalVariableIdSet = computed(() => new Set(props.globalVariableIds ?? []));

// Every variable claimed by any *currently active* preset (base or an
// activity), deduped by id — since base can now be unchecked, a variable it
// claims (e.g. climate) only shows if base is active or some other active
// preset claims it too, not unconditionally.
const activeVariablesById = computed(() => {
  const map = new Map<string, PresetVariable>();
  for (const option of allOptions.value) {
    if (!props.modelValue.presetIds.includes(option.id)) continue;
    for (const variable of option.variables ?? []) {
      if (!map.has(variable.id)) map.set(variable.id, variable);
    }
  }
  return map;
});

const globalVariables = computed(() =>
  [...activeVariablesById.value.values()].filter((variable) => globalVariableIdSet.value.has(variable.id)),
);

// Every *other* variable a currently selected activity preset claims (e.g.
// Sommerlager's "Rolle") — variables already covered by `globalVariables`
// are excluded here so they don't render twice. Only shown while the
// claiming preset is actually selected.
const presetsWithVariables = computed(() =>
  props.activityOptions
    .map((preset) => ({ ...preset, variables: (preset.variables ?? []).filter((variable) => !globalVariableIdSet.value.has(variable.id)) }))
    .filter((preset) => props.modelValue.presetIds.includes(preset.id) && preset.variables.length > 0),
);

const tripDays = computed(() => daysBetweenInclusive(props.modelValue.startDate, props.modelValue.endDate));
const tripNights = computed(() => Math.max(0, tripDays.value - 1));

// Start/end date need cross-field correction (keep endDate >= startDate),
// so they get dedicated setters instead of the generic field() helper.
function setStartDate(value: string) {
  if (!value) return;
  const next = { ...props.modelValue, startDate: value };
  if (next.endDate < value) next.endDate = value;
  emit('update:modelValue', next);
}

function setEndDate(value: string) {
  if (!value) return;
  const next = { ...props.modelValue, endDate: value };
  if (next.startDate > value) next.startDate = value;
  emit('update:modelValue', next);
}
</script>

<template>
  <form class="parameter-form" @submit.prevent>
    <p class="print-summary">{{ tripDays }} {{ tripDays === 1 ? 'Tag' : 'Tage' }}, {{ tripNights }} {{ tripNights === 1 ? 'Übernachtung' : 'Übernachtungen' }}</p>
    <div class="field field-wide">
      <span class="field-label">Basis</span>
      <div class="toggle-group" role="group" aria-label="Basis-Packliste ein-/ausschließen">
        <label class="toggle-chip" :class="{ active: modelValue.presetIds.includes(baseOption.id) }">
          <input
            type="checkbox"
            class="toggle-chip-input"
            :checked="modelValue.presetIds.includes(baseOption.id)"
            @change="togglePresetId(baseOption.id)"
          />
          {{ baseOption.name }}
        </label>
      </div>
      <p v-if="modelValue.presetIds.includes(baseOption.id) && baseOption.description" class="field-hint">
        {{ baseOption.description }}
      </p>
    </div>

    <div class="field field-wide">
      <span class="field-label">Aktivität (mehrere möglich)</span>
      <div class="toggle-group" role="group" aria-label="Aktivität auswählen">
        <label
          v-for="preset in activityOptions"
          :key="preset.id"
          class="toggle-chip"
          :class="{ active: modelValue.presetIds.includes(preset.id) }"
        >
          <input
            type="checkbox"
            class="toggle-chip-input"
            :checked="modelValue.presetIds.includes(preset.id)"
            @change="togglePresetId(preset.id)"
          />
          {{ preset.name }}
        </label>
      </div>
      <p v-for="description in selectedDescriptions" :key="description" class="field-hint">{{ description }}</p>
    </div>

    <div v-for="preset in presetsWithVariables" :key="preset.id" class="field field-wide">
      <span class="field-label">{{ preset.name }}</span>
      <div class="preset-variable-group">
        <div v-for="variable in preset.variables" :key="variable.id" class="field">
          <label :for="`pv-${preset.id}-${variable.id}`">{{ variable.label }}</label>
          <select
            :id="`pv-${preset.id}-${variable.id}`"
            :value="singleVarValue(variable)"
            @change="setSingleVar(variable, ($event.target as HTMLSelectElement).value)"
          >
            <option v-if="variable.allowUnset" value="">Keine Angabe</option>
            <option v-for="option in variable.options" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </div>
      </div>
    </div>

    <div class="field">
      <label for="start-date">Anreise</label>
      <input
        id="start-date"
        type="date"
        :value="modelValue.startDate"
        @change="setStartDate(($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="field">
      <label for="end-date">Abreise</label>
      <input
        id="end-date"
        type="date"
        :min="modelValue.startDate"
        :value="modelValue.endDate"
        @change="setEndDate(($event.target as HTMLInputElement).value)"
      />
      <p class="field-hint">Reisedauer: {{ tripDays }} {{ tripDays === 1 ? 'Tag' : 'Tage' }}</p>
    </div>

    <div v-for="variable in globalVariables" :key="variable.id" class="field" :class="{ 'field-wide': variable.multi }">
      <template v-if="variable.multi">
        <span class="field-label">{{ variable.label }}</span>
        <div class="toggle-group" role="group" :aria-label="`${variable.label} auswählen`">
          <label
            v-for="option in variable.options"
            :key="option.value"
            class="toggle-chip"
            :class="{ active: varValue(variable).includes(option.value) }"
          >
            <input
              type="checkbox"
              class="toggle-chip-input"
              :checked="varValue(variable).includes(option.value)"
              @change="toggleMultiVar(variable, option.value)"
            />
            {{ option.label }}
          </label>
        </div>
      </template>
      <template v-else>
        <label :for="`gv-${variable.id}`">{{ variable.label }}</label>
        <select
          :id="`gv-${variable.id}`"
          :value="singleVarValue(variable)"
          @change="setSingleVar(variable, ($event.target as HTMLSelectElement).value)"
        >
          <option v-if="variable.allowUnset" value="">Keine Angabe</option>
          <option v-for="option in variable.options" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </template>
    </div>
  </form>
</template>
