<script setup lang="ts">
import { computed } from 'vue';
import type { ResolvedCategory, ResolvedItem } from '../lib/engine';
import type { ItemProgress, ItemState } from '../lib/schema';
import ItemRow from './ItemRow.vue';

const props = defineProps<{
  categories: ResolvedCategory[];
  itemProgress: Record<string, ItemProgress>;
}>();
const emit = defineEmits<{
  'state-change': [itemId: string, state: ItemState];
  'amount-change': [itemId: string, amount: number];
}>();

const totalCount = computed(() => props.categories.reduce((sum, c) => sum + c.items.length, 0));
const packedCount = computed(() =>
  props.categories.reduce(
    (sum, c) => sum + c.items.filter((item) => props.itemProgress[item.id]?.state === 'eingepackt').length,
    0,
  ),
);

function progressFor(item: ResolvedItem): ItemProgress {
  return props.itemProgress[item.id] ?? { state: 'offen', amount: item.quantityMax };
}
</script>

<template>
  <section class="packing-list">
    <p v-if="totalCount > 0" class="progress">{{ packedCount }} von {{ totalCount }} eingepackt</p>
    <div class="categories">
      <div v-for="category in categories" :key="category.name" class="category">
        <h2>{{ category.name }}</h2>
        <ItemRow
          v-for="item in category.items"
          :key="item.id"
          :item="item"
          :progress="progressFor(item)"
          @update:state="(state) => emit('state-change', item.id, state)"
          @update:amount="(amount) => emit('amount-change', item.id, amount)"
        />
      </div>
    </div>
  </section>
</template>
