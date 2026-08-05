<script setup lang="ts">
import { computed } from 'vue';
import type { Params } from '../lib/schema';

const props = defineProps<{
  modelValue: Params;
  presetOptions: { id: string; name: string; description?: string }[];
}>();
const emit = defineEmits<{ 'update:modelValue': [value: Params] }>();

// v-model-backed computed per field. Vue's SSR renderer special-cases
// v-model on <select> to mark the correct <option selected>, which plain
// :value/@change bindings do not — using v-model here avoids a hydration
// mismatch on first load.
function field<K extends keyof Params>(key: K) {
  return computed<Params[K]>({
    get: () => props.modelValue[key],
    set: (value) => emit('update:modelValue', { ...props.modelValue, [key]: value }),
  });
}

const presetId = field('presetId');
const days = field('days');
const climate = field('climate');
const travel = field('travel');
const destination = field('destination');
const gender = field('gender');

const selectedDescription = computed(() => props.presetOptions.find((p) => p.id === presetId.value)?.description);
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
      <label for="days">Reisedauer (Tage)</label>
      <input id="days" v-model.number="days" type="number" min="1" max="365" />
    </div>

    <div class="field">
      <label for="climate">Klima</label>
      <select id="climate" v-model="climate">
        <option value="warm">Warm</option>
        <option value="mild">Mild</option>
        <option value="kalt">Kalt</option>
        <option value="frostig">Frostig</option>
      </select>
    </div>

    <div class="field">
      <label for="travel">Verkehrsmittel</label>
      <select id="travel" v-model="travel">
        <option value="auto">Auto</option>
        <option value="bahn">Bahn</option>
        <option value="flugzeug">Flugzeug</option>
      </select>
    </div>

    <div class="field">
      <label for="destination">Reiseziel</label>
      <select id="destination" v-model="destination">
        <option value="inland">Inland</option>
        <option value="eu_schengen">EU / Schengen</option>
        <option value="international">International</option>
      </select>
    </div>

    <div class="field">
      <label for="gender">Geschlecht</label>
      <select id="gender" v-model="gender">
        <option value="divers">Divers</option>
        <option value="maennlich">Männlich</option>
        <option value="weiblich">Weiblich</option>
      </select>
    </div>
  </form>
</template>
