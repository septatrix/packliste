<script setup lang="ts">
import { computed } from 'vue';
import type { ResolvedCategory } from '../lib/engine';
import type { ItemState } from '../lib/schema';
import ItemRow from './ItemRow.vue';

const props = defineProps<{
  categories: ResolvedCategory[];
  itemStates: Record<string, ItemState>;
}>();
const emit = defineEmits<{ 'state-change': [itemId: string, state: ItemState] }>();

const totalCount = computed(() => props.categories.reduce((sum, c) => sum + c.items.length, 0));
const packedCount = computed(() =>
  props.categories.reduce(
    (sum, c) => sum + c.items.filter((item) => props.itemStates[item.id] === 'eingepackt').length,
    0,
  ),
);

function stateFor(itemId: string): ItemState {
  return props.itemStates[itemId] ?? 'offen';
}
</script>

<template>
  <section class="packing-list">
    <p v-if="totalCount > 0" class="progress">{{ packedCount }} von {{ totalCount }} eingepackt</p>
    <div v-for="category in categories" :key="category.name" class="category">
      <h2>{{ category.name }}</h2>
      <ItemRow
        v-for="item in category.items"
        :key="item.id"
        :item="item"
        :state="stateFor(item.id)"
        @update:state="(state) => emit('state-change', item.id, state)"
      />
    </div>
  </section>
</template>
