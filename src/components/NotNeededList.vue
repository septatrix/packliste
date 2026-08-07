<script setup lang="ts">
import { computed } from 'vue';
import type { ResolvedItem } from '../lib/engine';
import type { ItemProgress } from '../lib/schema';

const props = defineProps<{ items: ResolvedItem[]; itemProgress: Record<string, ItemProgress> }>();

const notNeededItems = computed(() =>
  props.items
    .filter((item) => props.itemProgress[item.id]?.state === 'nicht_benoetigt')
    .map((item) => ({ item, amount: props.itemProgress[item.id]?.amount ?? item.quantityMax })),
);
</script>

<template>
  <section v-if="notNeededItems.length > 0" class="not-needed-list">
    <h2>Nicht benötigt</h2>
    <ul>
      <li v-for="{ item, amount } in notNeededItems" :key="item.id">
        <span aria-hidden="true">{{ item.icon }}</span>
        {{ item.name }} <span v-if="item.quantityMax !== undefined" class="item-quantity">×{{ amount }}</span>
      </li>
    </ul>
  </section>
</template>
