<script setup lang="ts">
import { ref } from 'vue'
import type { MonthGroup } from '@/types/spotify'
import TrackList from './TrackList.vue'

defineProps<{
  group: MonthGroup
  selected: boolean
}>()

defineEmits<{
  toggle: []
}>()

const expanded = ref(false)
</script>

<template>
  <li class="month-group-item">
    <div class="row">
      <label>
        <input type="checkbox" :checked="selected" @change="$emit('toggle')" />
        {{ group.label }} ({{ group.tracks.length }} titres)
      </label>
      <button type="button" class="expand-button" @click="expanded = !expanded">
        {{ expanded ? 'Masquer' : 'Voir les titres' }}
      </button>
    </div>
    <TrackList v-if="expanded" :tracks="group.tracks" />
  </li>
</template>

<style scoped>
.month-group-item {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.expand-button {
  background: none;
  border: none;
  color: hsla(160, 100%, 37%, 1);
  cursor: pointer;
  font-size: 0.85rem;
}
</style>
