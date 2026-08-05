<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import ParameterForm from './ParameterForm.vue';
import PackingList from './PackingList.vue';
import TomorrowList from './TomorrowList.vue';
import { DEFAULT_PARAMS, type ItemState, type Params } from '../lib/schema';
import { activityPresets, base, findActivityPreset } from '../presets';
import { resolveList, type ResolvedItem } from '../lib/engine';
import { loadItemProgress, loadParams, saveItemProgress, saveParams } from '../lib/storage';

const presetOptions = activityPresets.map((preset) => ({
  id: preset.id,
  name: preset.name,
  description: preset.description,
}));

const params = reactive<Params>(loadParams() ?? { ...DEFAULT_PARAMS, presetId: activityPresets[0]?.id ?? '' });
const itemProgress = reactive(loadItemProgress());

watch(params, (value) => saveParams({ ...value }), { deep: true });
watch(itemProgress, (value) => saveItemProgress({ ...value }), { deep: true });

const selectedPreset = computed(() => findActivityPreset(params.presetId));

const categories = computed(() => {
  const preset = selectedPreset.value;
  return preset ? resolveList(params, [base, preset]) : [];
});

const allItems = computed<ResolvedItem[]>(() => categories.value.flatMap((c) => c.items));
const itemById = computed(() => new Map(allItems.value.map((item) => [item.id, item])));

function onParamsUpdate(value: Params) {
  Object.assign(params, value);
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
      <h1>Packliste</h1>
      <p>Erstelle eine interaktive Packliste für deine nächste Reise.</p>
    </header>

    <ParameterForm :model-value="params" :preset-options="presetOptions" @update:model-value="onParamsUpdate" />

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
  </div>
</template>
