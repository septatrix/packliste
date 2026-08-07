<script setup lang="ts">
import { computed } from 'vue';
import type { ResolvedItem } from '../lib/engine';
import type { ItemProgress, ItemState } from '../lib/schema';

const props = defineProps<{ item: ResolvedItem; progress: ItemProgress; activeTool: ItemState | null }>();
const emit = defineEmits<{ 'update:state': [state: ItemState]; 'update:amount': [amount: number] }>();

// With a tool active (see PackingList), clicking anywhere on the row applies
// it — a second click on an already-matching item clears back to "offen",
// so the tool also works as an undo. Clicks inside .item-controls (the
// amount input and the explicit per-state buttons) are stopped before they
// reach this handler (see @click.stop in the template) so they keep their
// own, tool-independent behavior.
function onRowClick() {
  if (!props.activeTool) return;
  emit('update:state', props.progress.state === props.activeTool ? 'offen' : props.activeTool);
}

const STATES: { value: ItemState; icon: string; label: string }[] = [
  { value: 'offen', icon: '○', label: 'Offen' },
  { value: 'eingepackt', icon: '✓', label: 'Eingepackt' },
  { value: 'nicht_benoetigt', icon: '✕', label: 'Nicht benötigt' },
  { value: 'morgen', icon: '⏰', label: 'Vor Abfahrt' },
];

const hasQuantity = computed(() => props.item.quantityMax !== undefined);

// Shown in the info icon's tooltip: which preset(s) this item came from
// (plural if the item was merged from more than one, see resolveList), and
// (when available) how its suggested quantity was computed.
const infoText = computed(() => {
  const sourceLabel = props.item.sourceNames.length > 1 ? 'Aus Presets' : 'Aus Preset';
  const lines = [`${sourceLabel}: ${props.item.sourceNames.join(', ')}`];
  if (hasQuantity.value) lines.push(`Empfehlung: ${props.item.quantityLabel}`);
  if (props.item.note) lines.push(props.item.note);
  return lines.join('\n');
});

// The amount input starts out prefilled with quantityMax (see PackingList's
// progressFor()/PackingApp's onStateChange fallback). Three states:
// - default (still quantityMax): no highlight.
// - below quantityMin: a warning — you may not be bringing enough.
// - anything else changed (within the range, or above quantityMax): a
//   plain "this was adjusted" highlight, nothing to worry about.
const amountStatus = computed<'default' | 'under' | 'changed'>(() => {
  if (!hasQuantity.value) return 'default';
  if (props.progress.amount < props.item.quantityMin!) return 'under';
  if (props.progress.amount !== props.item.quantityMax) return 'changed';
  return 'default';
});

const amountTitle = computed(() => {
  if (amountStatus.value === 'under') return `Unter der Empfehlung (Empfehlung: ${props.item.quantityLabel})`;
  if (amountStatus.value === 'changed') return `Angepasst (Empfehlung: ${props.item.quantityLabel})`;
  return `Empfehlung: ${props.item.quantityLabel}`;
});

function onAmountInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  emit('update:amount', Number.isFinite(value) && value >= 0 ? Math.round(value) : 0);
}
</script>

<template>
  <div
    class="item-row"
    :class="[`state-${progress.state}`, { 'tool-active': activeTool }]"
    @click="onRowClick"
  >
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
    <div class="item-controls" @click.stop>
      <input
        v-if="hasQuantity"
        class="item-amount"
        :class="{
          'item-amount-overridden': amountStatus === 'changed',
          'item-amount-under-recommended': amountStatus === 'under',
        }"
        type="number"
        min="0"
        step="1"
        :value="progress.amount"
        :title="amountTitle"
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
