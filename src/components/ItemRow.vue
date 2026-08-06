<script setup lang="ts">
import { computed } from 'vue';
import type { ResolvedItem } from '../lib/engine';
import type { ItemProgress, ItemState } from '../lib/schema';

const props = defineProps<{ item: ResolvedItem; progress: ItemProgress }>();
const emit = defineEmits<{ 'update:state': [state: ItemState]; 'update:amount': [amount: number] }>();

const STATES: { value: ItemState; icon: string; label: string }[] = [
  { value: 'offen', icon: '○', label: 'Offen' },
  { value: 'eingepackt', icon: '✓', label: 'Eingepackt' },
  { value: 'nicht_benoetigt', icon: '✕', label: 'Nicht benötigt' },
  { value: 'morgen', icon: '⏰', label: 'Für morgen' },
];

// Shown in the info icon's tooltip: which preset this item came from, and
// (when available) how its suggested quantity was computed.
const infoText = computed(() => {
  const lines = [`Aus Preset: ${props.item.sourceName}`, `Empfehlung: ${props.item.quantityLabel}`];
  if (props.item.note) lines.push(props.item.note);
  return lines.join('\n');
});

function onAmountInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  emit('update:amount', Number.isFinite(value) && value >= 0 ? Math.round(value) : 0);
}
</script>

<template>
  <div class="item-row" :class="`state-${progress.state}`">
    <div class="item-info">
      <span class="item-icon" aria-hidden="true">{{ item.icon }}</span>
      <span
        class="item-importance-dot"
        :class="`importance-${item.importance}`"
        :title="item.importance === 'pflicht' ? 'Pflicht' : 'Optional'"
      ></span>
      <span class="item-name" :title="item.name">{{ item.name }}</span>
      <span class="item-info-icon" tabindex="0" role="note" :aria-label="infoText" :title="infoText">ⓘ</span>
    </div>
    <div class="item-controls">
      <input
        class="item-amount"
        type="number"
        min="0"
        step="1"
        :value="progress.amount"
        :title="`Empfehlung: ${item.quantityLabel}`"
        @input="onAmountInput"
      />
      <div class="item-state" role="radiogroup" :aria-label="`Status für ${item.name}`">
        <button
          v-for="s in STATES"
          :key="s.value"
          type="button"
          class="state-button"
          role="radio"
          :aria-checked="progress.state === s.value"
          :aria-label="s.label"
          :title="s.label"
          :class="{ active: progress.state === s.value }"
          @click="emit('update:state', s.value)"
        >
          {{ s.icon }}
        </button>
      </div>
    </div>
  </div>
</template>
