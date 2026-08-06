<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';

export interface PresetCodeEntry {
  id: string;
  name: string;
  /** Pre-rendered Shiki HTML (build-time syntax highlighting), trusted (our own bundled sources). */
  html: string;
}

const props = defineProps<{
  open: boolean;
  presets: PresetCodeEntry[];
  /** Preset to show first when the modal opens, e.g. the currently selected one. */
  initialId?: string;
}>();
const emit = defineEmits<{ close: [] }>();

const activeId = ref(props.initialId ?? props.presets[0]?.id ?? '');

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      activeId.value = props.presets.some((p) => p.id === props.initialId) ? (props.initialId as string) : (props.presets[0]?.id ?? '');
    }
  },
);

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) emit('close');
}
onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div v-if="open" class="inspector-overlay" @click.self="emit('close')">
    <div class="inspector-modal" role="dialog" aria-modal="true" aria-label="Preset-Quellcode">
      <div class="inspector-header">
        <div class="inspector-tabs">
          <button
            v-for="preset in presets"
            :key="preset.id"
            type="button"
            class="inspector-tab"
            :class="{ active: preset.id === activeId }"
            @click="activeId = preset.id"
          >
            {{ preset.name }}
          </button>
        </div>
        <button type="button" class="inspector-close" aria-label="Schließen" @click="emit('close')">✕</button>
      </div>
      <div
        v-for="preset in presets"
        v-show="preset.id === activeId"
        :key="preset.id"
        class="inspector-code"
        v-html="preset.html"
      ></div>
    </div>
  </div>
</template>
