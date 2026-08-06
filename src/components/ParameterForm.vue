<script setup lang="ts">
import { computed } from 'vue';
import { daysBetweenInclusive } from '../lib/dates';
import type { TripSelection } from '../lib/schema';

const props = defineProps<{
  modelValue: TripSelection;
  presetOptions: { id: string; name: string; description?: string }[];
}>();
const emit = defineEmits<{ 'update:modelValue': [value: TripSelection] }>();

// v-model-backed computed per field. Vue's SSR renderer special-cases
// v-model on <select> to mark the correct <option selected>, which plain
// :value/@change bindings do not — using v-model here avoids a hydration
// mismatch on first load.
function field<K extends keyof TripSelection>(key: K) {
  return computed<TripSelection[K]>({
    get: () => props.modelValue[key],
    set: (value) => emit('update:modelValue', { ...props.modelValue, [key]: value }),
  });
}

// Same idea, but for the four optional dimensions: native <select> values
// are always strings, so the empty "Keine Angabe" option is represented as
// '' in the DOM and converted to/from `undefined` in the model here.
function optionalField<K extends 'climate' | 'travel' | 'destination' | 'gender'>(key: K) {
  return computed<string>({
    get: () => props.modelValue[key] ?? '',
    set: (value) => emit('update:modelValue', { ...props.modelValue, [key]: value === '' ? undefined : value }),
  });
}

const presetId = field('presetId');
const climate = optionalField('climate');
const travel = optionalField('travel');
const destination = optionalField('destination');
const gender = optionalField('gender');

const selectedDescription = computed(() => props.presetOptions.find((p) => p.id === presetId.value)?.description);

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
    <div class="field">
      <label for="preset">Aktivität</label>
      <select id="preset" v-model="presetId">
        <option value="" disabled>Bitte wählen…</option>
        <option v-for="preset in presetOptions" :key="preset.id" :value="preset.id">{{ preset.name }}</option>
      </select>
      <p v-if="selectedDescription" class="field-hint">{{ selectedDescription }}</p>
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

    <div class="field">
      <label for="climate">Klima</label>
      <select id="climate" v-model="climate">
        <option value="">Keine Angabe</option>
        <option value="warm">Warm</option>
        <option value="mild">Mild</option>
        <option value="kalt">Kalt</option>
        <option value="frostig">Frostig</option>
      </select>
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
