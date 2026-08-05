<script setup lang="ts">
import { computed } from 'vue';
import type { ResolvedItem } from '../lib/engine';
import type { ItemProgress } from '../lib/schema';

const props = defineProps<{ items: ResolvedItem[]; itemProgress: Record<string, ItemProgress> }>();

const tomorrowItems = computed(() =>
  props.items
    .filter((item) => props.itemProgress[item.id]?.state === 'morgen')
    .map((item) => ({ item, amount: props.itemProgress[item.id]?.amount ?? item.quantityMax })),
);
</script>

<template>
  <section v-if="tomorrowItems.length > 0" class="tomorrow-list">
    <h2>Für morgen besorgen</h2>
    <ul>
      <li v-for="{ item, amount } in tomorrowItems" :key="item.id">
        <span aria-hidden="true">{{ item.icon }}</span>
        {{ item.name }} <span class="item-quantity">×{{ amount }}</span>
      </li>
    </ul>
  </section>
</template>
