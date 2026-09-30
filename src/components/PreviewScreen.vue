<script setup lang="ts">
import { computed } from 'vue'
import type { GroupingMode } from '@/types/spotify'
import { useLikesStore } from '@/stores/likes'
import { usePlaylistsStore } from '@/stores/playlists'
import GroupItem from './GroupItem.vue'

const emit = defineEmits<{
  'change-mode': [mode: GroupingMode]
  create: []
}>()

const likesStore = useLikesStore()
const playlistsStore = usePlaylistsStore()

const selectionCount = computed(() => playlistsStore.selectedGroups.size)
const hasSelection = computed(() => selectionCount.value > 0)

const MODE_OPTIONS: { value: GroupingMode; label: string }[] = [
  { value: 'quarter', label: 'Par trimestre' },
  { value: 'genre', label: 'Par genre' },
]
</script>

<template>
  <div class="preview-screen">
    <div class="action-bar">
      <span class="selection-count">
        <template v-if="hasSelection">
          {{ selectionCount }} playlist{{ selectionCount > 1 ? 's' : '' }} à créer
        </template>
        <template v-else>Aucune playlist sélectionnée</template>
      </span>
      <button type="button" :disabled="!hasSelection" @click="emit('create')">
        Créer {{ hasSelection ? `(${selectionCount})` : '' }}
      </button>
    </div>

    <h2>Titres likés</h2>
    <div class="mode-selector">
      <label v-for="option in MODE_OPTIONS" :key="option.value" class="mode-option">
        <input
          type="radio"
          name="grouping-mode"
          :value="option.value"
          :checked="likesStore.groupingMode === option.value"
          @change="emit('change-mode', option.value)"
        />
        <span>{{ option.label }}</span>
      </label>
    </div>
    <ul class="group-list">
      <GroupItem v-for="group in likesStore.groups" :key="group.key" :group="group" />
    </ul>
  </div>
</template>

<style scoped>
.action-bar {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.1rem;
  margin-bottom: 1.5rem;
  border-radius: 12px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
}

.selection-count {
  font-size: 0.9rem;
  opacity: 0.85;
}

.preview-screen h2 {
  font-size: 1.4rem;
}

.mode-selector {
  display: flex;
  gap: 0.6rem;
  margin: 1.25rem 0 1.75rem;
  flex-wrap: wrap;
}

.mode-option {
  position: relative;
  cursor: pointer;
}

.mode-option input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.mode-option span {
  display: inline-block;
  padding: 0.6rem 1.2rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  font-size: 0.9rem;
  transition: all 0.15s;
}

.mode-option:hover span {
  border-color: hsla(160, 100%, 37%, 1);
}

.mode-option input:checked + span {
  background: hsla(160, 100%, 37%, 1);
  border-color: hsla(160, 100%, 37%, 1);
  color: white;
  font-weight: 600;
}

.mode-option input:focus-visible + span {
  outline: 2px solid hsla(160, 100%, 37%, 1);
  outline-offset: 2px;
}

.group-list {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
}

button {
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 999px;
  background: hsla(160, 100%, 37%, 1);
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s;
  white-space: nowrap;
}

button:hover:not(:disabled) {
  background: hsla(160, 100%, 42%, 1);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}
</style>
