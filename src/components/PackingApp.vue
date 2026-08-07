<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import ParameterForm from './ParameterForm.vue';
import PackingList from './PackingList.vue';
import TomorrowList from './TomorrowList.vue';
import NotNeededList from './NotNeededList.vue';
import PresetInspector, { type PresetCodeEntry } from './PresetInspector.vue';
import { DEFAULT_TRIP_SELECTION, deriveParams, type ItemState, type TripSelection } from '../lib/schema';
import { activityPresets, allPresets, base } from '../presets';
import { SHARED_VARIABLE_IDS } from '../presets/sharedVariables';
import { resolveList, type ResolvedItem } from '../lib/engine';
import { loadItemProgress, loadTripSelection, saveItemProgress, saveTripSelection } from '../lib/storage';
import { applyQueryOverrides, tripSelectionToQueryString } from '../lib/queryParams';

const props = defineProps<{ presetCode: PresetCodeEntry[] }>();

const baseOption = { id: base.id, name: base.name, description: base.description, variables: base.variables };
const activityOptions = activityPresets.map((preset) => ({
  id: preset.id,
  name: preset.name,
  description: preset.description,
  variables: preset.variables,
}));

// Query-param overrides (?activities=base,skifahren,wandern&climate=kalt&
// start=...&end=...&travel=...&destination=...&gender=...) are applied on
// top of whatever localStorage/the default would otherwise produce, so a
// shared link can prefill only the fields it specifies and leave the rest
// as-is. `base` is selected by default (alongside the first activity) but,
// like every other preset, can be unchecked — it's just another entry in
// `presetIds`, not forced in unconditionally.
const storedOrDefaultSelection: TripSelection =
  loadTripSelection() ?? {
    ...DEFAULT_TRIP_SELECTION,
    presetIds: [base.id, ...(activityPresets[0] ? [activityPresets[0].id] : [])],
  };
const tripSelection = reactive<TripSelection>(applyQueryOverrides(storedOrDefaultSelection, window.location.search));
const itemProgress = reactive(loadItemProgress());
const inspectorOpen = ref(false);
// The "click to mark" tool (see PackingList/ItemRow): while set, clicking
// anywhere on an item row applies this state instead of requiring the
// small per-item state buttons. Session-only — not persisted.
const activeTool = ref<ItemState | null>(null);

watch(
  tripSelection,
  (value) => {
    saveTripSelection({ ...value });
    // Keeps the address bar a live permalink for the trip currently shown
    // (see `tripSelectionToQueryString`) — `replaceState`, not `pushState`,
    // so every toggle/date/variable change doesn't spam browser history.
    window.history.replaceState(null, '', `${window.location.pathname}?${tripSelectionToQueryString(value)}`);
  },
  { deep: true },
);
watch(itemProgress, (value) => saveItemProgress({ ...value }), { deep: true });

// `allPresets` (base first, then activities in registration order) filtered
// down to whatever's actually selected — using this fixed canonical order
// rather than `presetIds`' click order matters: `resolveList()`'s merge
// rule is "last preset wins" for a shared item's name/icon/etc., and that's
// only meaningful if `base` (the generic fallback) reliably comes first
// regardless of the order things were toggled in.
const selectedPresets = computed(() => allPresets.filter((preset) => tripSelection.presetIds.includes(preset.id)));
const selectedActivityPresets = computed(() => selectedPresets.value.filter((preset) => preset.id !== base.id));

const categories = computed(() => resolveList(deriveParams(tripSelection), selectedPresets.value, tripSelection.vars));

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

    <ParameterForm
      :model-value="tripSelection"
      :base-option="baseOption"
      :activity-options="activityOptions"
      :global-variable-ids="SHARED_VARIABLE_IDS"
      @update:model-value="onSelectionUpdate"
    />

    <p v-if="selectedPresets.length === 0" class="hint">
      Noch nichts ausgewählt — wähle oben mindestens die Basis-Packliste oder eine Aktivität, um Artikel zu sehen.
    </p>
    <p v-else-if="selectedActivityPresets.length === 0" class="hint">
      Noch keine Aktivität ausgewählt — hier ist schon mal die Basis-Packliste. Wähle oben eine oder mehrere Aktivitäten
      für zusätzliche, aktivitätsspezifische Artikel.
    </p>

    <PackingList
      :categories="categories"
      :item-progress="itemProgress"
      :active-tool="activeTool"
      @state-change="onStateChange"
      @amount-change="onAmountChange"
      @update:active-tool="(tool) => (activeTool = tool)"
    />
    <TomorrowList :items="allItems" :item-progress="itemProgress" />
    <NotNeededList :items="allItems" :item-progress="itemProgress" />

    <PresetInspector
      :open="inspectorOpen"
      :presets="props.presetCode"
      :initial-id="tripSelection.presetIds[0]"
      @close="inspectorOpen = false"
    />
  </div>
</template>
