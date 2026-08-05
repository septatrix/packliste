<script setup lang="ts">
import type { ResolvedItem } from '../lib/engine';
import type { ItemState } from '../lib/schema';

defineProps<{ item: ResolvedItem; state: ItemState }>();
const emit = defineEmits<{ 'update:state': [state: ItemState] }>();

const STATES: { value: ItemState; label: string }[] = [
  { value: 'offen', label: 'Offen' },
  { value: 'eingepackt', label: 'Eingepackt' },
  { value: 'nicht_benoetigt', label: 'Nicht benötigt' },
  { value: 'morgen', label: 'Für morgen' },
];
</script>

<template>
  <div class="item-row" :class="`state-${state}`">
    <div class="item-info">
      <span class="item-name">{{ item.name }}</span>
      <span class="item-quantity">×{{ item.quantityLabel }}</span>
      <span class="item-importance" :class="`importance-${item.importance}`">
        {{ item.importance === 'pflicht' ? 'Pflicht' : 'Optional' }}
      </span>
    </div>
    <div class="item-state" role="radiogroup" :aria-label="`Status für ${item.name}`">
      <button
        v-for="s in STATES"
        :key="s.value"
        type="button"
        class="state-button"
        role="radio"
        :aria-checked="state === s.value"
        :class="{ active: state === s.value }"
        @click="emit('update:state', s.value)"
      >
        {{ s.label }}
      </button>
    </div>
  </div>
</template>
