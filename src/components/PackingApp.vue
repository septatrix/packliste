<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import ParameterForm from './ParameterForm.vue';
import PackingList from './PackingList.vue';
import TomorrowList from './TomorrowList.vue';
import PresetInspector, { type PresetCodeEntry } from './PresetInspector.vue';
import { DEFAULT_TRIP_SELECTION, deriveParams, type ItemState, type TripSelection } from '../lib/schema';
import { activityPresets, base, findActivityPreset } from '../presets';
import { resolveList, type ResolvedItem } from '../lib/engine';
import { loadItemProgress, loadTripSelection, saveItemProgress, saveTripSelection } from '../lib/storage';

const props = defineProps<{ presetCode: PresetCodeEntry[] }>();

const presetOptions = activityPresets.map((preset) => ({
  id: preset.id,
  name: preset.name,
  description: preset.description,
}));

const tripSelection = reactive<TripSelection>(
  loadTripSelection() ?? { ...DEFAULT_TRIP_SELECTION, presetId: activityPresets[0]?.id ?? '' },
);
const itemProgress = reactive(loadItemProgress());
const inspectorOpen = ref(false);

watch(tripSelection, (value) => saveTripSelection({ ...value }), { deep: true });
watch(itemProgress, (value) => saveItemProgress({ ...value }), { deep: true });

const selectedPreset = computed(() => findActivityPreset(tripSelection.presetId));

const categories = computed(() => {
  const preset = selectedPreset.value;
  return preset ? resolveList(deriveParams(tripSelection), [base, preset]) : [];
});

const allItems = computed<ResolvedItem[]>(() => categories.value.flatMap((c) => c.items));
const itemById = computed(() => new Map(allItems.value.map((item) => [item.id, item])));

function onSelectionUpdate(value: TripSelection) {
  Object.assign(tripSelection, value);
}

function onStateChange(itemId: string, state: ItemState) {
  const existing = itemProgress[itemId];
  const amount = existing?.amount ?? itemById.value.get(itemId)?.quantityMax ?? 0;
  itemProgress[itemId] = { state, amount };
}

function onAmountChange(itemId: string, amount: number) {
  const existing = itemProgress[itemId];
  itemProgress[itemId] = { state: existing?.state ?? 'offen', amount };
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="app-header-row">
        <div>
          <h1>Packliste</h1>
          <p>Erstelle eine interaktive Packliste für deine nächste Reise.</p>
        </div>
        <button type="button" class="inspect-button" @click="inspectorOpen = true">📜 Presets ansehen</button>
      </div>
    </header>

    <ParameterForm :model-value="tripSelection" :preset-options="presetOptions" @update:model-value="onSelectionUpdate" />

    <template v-if="selectedPreset">
      <PackingList
        :categories="categories"
        :item-progress="itemProgress"
        @state-change="onStateChange"
        @amount-change="onAmountChange"
      />
      <TomorrowList :items="allItems" :item-progress="itemProgress" />
    </template>
    <p v-else class="hint">Bitte wähle oben eine Aktivität aus, um deine Packliste zu erstellen.</p>

    <PresetInspector
      :open="inspectorOpen"
      :presets="props.presetCode"
      :initial-id="tripSelection.presetId"
      @close="inspectorOpen = false"
    />
  </div>
</template>
