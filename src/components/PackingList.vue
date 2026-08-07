<script setup lang="ts">
import { computed } from 'vue';
import type { ResolvedCategory, ResolvedItem } from '../lib/engine';
import type { ItemProgress, ItemState } from '../lib/schema';
import ItemRow from './ItemRow.vue';

const props = defineProps<{
  categories: ResolvedCategory[];
  itemProgress: Record<string, ItemProgress>;
  /** See ItemRow: while set, clicking anywhere on a row applies this state. */
  activeTool: ItemState | null;
}>();
const emit = defineEmits<{
  'state-change': [itemId: string, state: ItemState];
  'amount-change': [itemId: string, amount: number];
  'update:active-tool': [tool: ItemState | null];
}>();

const TOOLS: { value: ItemState; icon: string; label: string; title: string }[] = [
  { value: 'eingepackt', icon: '🖊️', label: 'Markieren', title: 'Marker: Klick auf einen Artikel packt ihn ein' },
  {
    value: 'nicht_benoetigt',
    icon: '✂️',
    label: 'Streichen',
    title: 'Streichen: Klick auf einen Artikel markiert ihn als nicht benötigt',
  },
];

function toggleTool(tool: ItemState) {
  emit('update:active-tool', props.activeTool === tool ? null : tool);
}

const totalCount = computed(() => props.categories.reduce((sum, c) => sum + c.items.length, 0));
const packedCount = computed(() =>
  props.categories.reduce(
    (sum, c) => sum + c.items.filter((item) => props.itemProgress[item.id]?.state === 'eingepackt').length,
    0,
  ),
);

function progressFor(item: ResolvedItem): ItemProgress {
  return props.itemProgress[item.id] ?? { state: 'offen', amount: item.quantityMax ?? 0 };
}
</script>

<template>
  <section class="packing-list">
    <p v-if="totalCount > 0" class="progress">{{ packedCount }} von {{ totalCount }} eingepackt</p>
    <div v-if="totalCount > 0" class="tool-bar" role="group" aria-label="Werkzeug zum Markieren von Artikeln">
      <button
        v-for="tool in TOOLS"
        :key="tool.value"
        type="button"
        class="tool-button"
        :class="{ active: activeTool === tool.value }"
        :aria-pressed="activeTool === tool.value"
        :title="tool.title"
        @click="toggleTool(tool.value)"
      >
        <span aria-hidden="true">{{ tool.icon }}</span> {{ tool.label }}
      </button>
    </div>
    <div class="categories">
      <div v-for="category in categories" :key="category.name" class="category">
        <h2>{{ category.name }}</h2>
        <ItemRow
          v-for="item in category.items"
          :key="item.id"
          :item="item"
          :progress="progressFor(item)"
          :active-tool="activeTool"
          @update:state="(state) => emit('state-change', item.id, state)"
          @update:amount="(amount) => emit('amount-change', item.id, amount)"
        />
      </div>
    </div>
  </section>
</template>
