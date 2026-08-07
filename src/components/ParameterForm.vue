<script setup lang="ts">
import { computed } from 'vue';
import { daysBetweenInclusive } from '../lib/dates';
import type { Climate, PresetVariable, TripSelection } from '../lib/schema';

const props = defineProps<{
  modelValue: TripSelection;
  presetOptions: { id: string; name: string; description?: string; variables?: PresetVariable[] }[];
}>();
const emit = defineEmits<{ 'update:modelValue': [value: TripSelection] }>();

const CLIMATE_OPTIONS: { value: Climate; label: string }[] = [
  { value: 'warm', label: 'Warm' },
  { value: 'mild', label: 'Mild' },
  { value: 'kalt', label: 'Kalt' },
  { value: 'frostig', label: 'Frostig' },
];

// v-model-backed computed per field, for the three remaining optional
// single-value dimensions. Vue's SSR renderer special-cases v-model on
// <select> to mark the correct <option selected>, which plain :value/
// @change bindings do not — using v-model avoids a hydration mismatch on
// first load. Native <select> values are always strings, so the empty
// "Keine Angabe" option is represented as '' in the DOM and converted
// to/from `undefined` in the model here.
function optionalField<K extends 'travel' | 'destination' | 'gender'>(key: K) {
  return computed<string>({
    get: () => props.modelValue[key] ?? '',
    set: (value) => emit('update:modelValue', { ...props.modelValue, [key]: value === '' ? undefined : value }),
  });
}

const travel = optionalField('travel');
const destination = optionalField('destination');
const gender = optionalField('gender');

// Activities and climate are multi-select — a trip can combine several
// activities (e.g. Skifahren *and* Sommerlager) and several climates (e.g.
// hot days and cold nights), so these toggle a value in/out of an array
// instead of picking a single one.
function togglePresetId(id: string) {
  const current = props.modelValue.presetIds;
  const next = current.includes(id) ? current.filter((existing) => existing !== id) : [...current, id];
  emit('update:modelValue', { ...props.modelValue, presetIds: next });
}

function toggleClimate(value: Climate) {
  const current = props.modelValue.climate;
  const next = current.includes(value) ? current.filter((existing) => existing !== value) : [...current, value];
  emit('update:modelValue', { ...props.modelValue, climate: next });
}

const selectedDescriptions = computed(() =>
  props.presetOptions.filter((preset) => props.modelValue.presetIds.includes(preset.id)).map((preset) => preset.description),
);

// Preset-specific variables (e.g. Sommerlager's "Rolle") only make sense —
// and are only shown — while their preset is actually selected.
const presetsWithVariables = computed(() =>
  props.presetOptions.filter(
    (preset) => props.modelValue.presetIds.includes(preset.id) && preset.variables && preset.variables.length > 0,
  ),
);

function presetVarValue(presetId: string, variable: PresetVariable): string {
  return props.modelValue.presetVars[presetId]?.[variable.id] ?? variable.default;
}

function setPresetVar(presetId: string, variableId: string, value: string) {
  emit('update:modelValue', {
    ...props.modelValue,
    presetVars: {
      ...props.modelValue.presetVars,
      [presetId]: { ...props.modelValue.presetVars[presetId], [variableId]: value },
    },
  });
}

const tripDays = computed(() => daysBetweenInclusive(props.modelValue.startDate, props.modelValue.endDate));

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
    <div class="field field-wide">
      <span class="field-label">Aktivität (mehrere möglich)</span>
      <div class="toggle-group" role="group" aria-label="Aktivität auswählen">
        <label
          v-for="preset in presetOptions"
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
            :value="presetVarValue(preset.id, variable)"
            @change="setPresetVar(preset.id, variable.id, ($event.target as HTMLSelectElement).value)"
          >
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

    <div class="field field-wide">
      <span class="field-label">Klima (mehrere möglich)</span>
      <div class="toggle-group" role="group" aria-label="Klima auswählen">
        <label
          v-for="option in CLIMATE_OPTIONS"
          :key="option.value"
          class="toggle-chip"
          :class="{ active: modelValue.climate.includes(option.value) }"
        >
          <input
            type="checkbox"
            class="toggle-chip-input"
            :checked="modelValue.climate.includes(option.value)"
            @change="toggleClimate(option.value)"
          />
          {{ option.label }}
        </label>
      </div>
    </div>

    <div class="field">
      <label for="travel">Verkehrsmittel</label>
      <select id="travel" v-model="travel">
        <option value="">Keine Angabe</option>
        <option value="auto">Auto</option>
        <option value="bahn">Bahn</option>
        <option value="flugzeug">Flugzeug</option>
      </select>
    </div>

    <div class="field">
      <label for="destination">Reiseziel</label>
      <select id="destination" v-model="destination">
        <option value="">Keine Angabe</option>
        <option value="inland">Inland</option>
        <option value="eu_schengen">EU / Schengen</option>
        <option value="international">International</option>
      </select>
    </div>

    <div class="field">
      <label for="gender">Geschlecht</label>
      <select id="gender" v-model="gender">
        <option value="">Keine Angabe</option>
        <option value="divers">Divers</option>
        <option value="maennlich">Männlich</option>
        <option value="weiblich">Weiblich</option>
      </select>
    </div>
  </form>
</template>
