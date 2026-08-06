<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import ParameterForm from './ParameterForm.vue';
import PackingList from './PackingList.vue';
import TomorrowList from './TomorrowList.vue';
import PresetInspector, { type PresetCodeEntry } from './PresetInspector.vue';
import { DEFAULT_TRIP_SELECTION, deriveParams, type ItemState, type PresetDefinition, type TripSelection } from '../lib/schema';
import { activityPresets, base, findActivityPreset } from '../presets';
import { resolveList, type ResolvedItem } from '../lib/engine';
import { loadItemProgress, loadTripSelection, saveItemProgress, saveTripSelection } from '../lib/storage';
import { applyQueryOverrides } from '../lib/queryParams';

const props = defineProps<{ presetCode: PresetCodeEntry[] }>();

const presetOptions = activityPresets.map((preset) => ({
  id: preset.id,
  name: preset.name,
  description: preset.description,
}));

// Query-param overrides (?activities=skifahren,wandern&climate=kalt&start=...&
// end=...&travel=...&destination=...&gender=...) are applied on top of
// whatever localStorage/the default would otherwise produce, so a shared
// link can prefill only the fields it specifies and leave the rest as-is.
const storedOrDefaultSelection: TripSelection =
  loadTripSelection() ?? {
    ...DEFAULT_TRIP_SELECTION,
    presetIds: activityPresets[0] ? [activityPresets[0].id] : [],
  };
const tripSelection = reactive<TripSelection>(applyQueryOverrides(storedOrDefaultSelection, window.location.search));
const itemProgress = reactive(loadItemProgress());
const inspectorOpen = ref(false);

watch(tripSelection, (value) => saveTripSelection({ ...value }), { deep: true });
watch(itemProgress, (value) => saveItemProgress({ ...value }), { deep: true });

// A trip can combine several activities (e.g. Skifahren *and* Sommerlager),
// so this is every matched preset, not just one.
const selectedPresets = computed<PresetDefinition[]>(() =>
  tripSelection.presetIds
    .map((id) => findActivityPreset(id))
    .filter((preset): preset is PresetDefinition => preset !== undefined),
);

// `base` is always merged in, even with zero activities selected — the
// universal essentials don't depend on having picked an activity.
const categories = computed(() => resolveList(deriveParams(tripSelection), [base, ...selectedPresets.value]));

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

    <p v-if="selectedPresets.length === 0" class="hint">
      Noch keine Aktivität ausgewählt — hier ist schon mal die Basis-Packliste. Wähle oben eine oder mehrere Aktivitäten
      für zusätzliche, aktivitätsspezifische Artikel.
    </p>

    <PackingList
      :categories="categories"
      :item-progress="itemProgress"
      @state-change="onStateChange"
      @amount-change="onAmountChange"
    />
    <TomorrowList :items="allItems" :item-progress="itemProgress" />

    <PresetInspector
      :open="inspectorOpen"
      :presets="props.presetCode"
      :initial-id="tripSelection.presetIds[0]"
      @close="inspectorOpen = false"
    />
  </div>
</template>
