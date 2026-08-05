<script setup lang="ts">
import { computed } from 'vue';
import type { ResolvedItem } from '../lib/engine';
import type { ItemState } from '../lib/schema';

const props = defineProps<{ items: ResolvedItem[]; itemStates: Record<string, ItemState> }>();

const tomorrowItems = computed(() => props.items.filter((item) => props.itemStates[item.id] === 'morgen'));
</script>

<template>
  <section v-if="tomorrowItems.length > 0" class="tomorrow-list">
    <h2>Für morgen besorgen</h2>
    <ul>
      <li v-for="item in tomorrowItems" :key="item.id">
        {{ item.name }} <span class="item-quantity">×{{ item.quantityLabel }}</span>
      </li>
    </ul>
  </section>
</template>
