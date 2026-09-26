<script setup lang="ts">
import { computed } from 'vue'
import type { MonthGroup } from '@/types/spotify'
import MonthGroupItem from './MonthGroupItem.vue'

const props = defineProps<{
  monthGroups: MonthGroup[]
  selectedMonths: Set<string>
}>()

const emit = defineEmits<{
  'toggle-month': [monthKey: string]
  create: []
}>()

const hasSelection = computed(() => props.selectedMonths.size > 0)
</script>

<template>
  <div class="preview-screen">
    <h2>Titres likés par mois</h2>
    <ul class="month-list">
      <MonthGroupItem
        v-for="group in monthGroups"
        :key="group.monthKey"
        :group="group"
        :selected="selectedMonths.has(group.monthKey)"
        @toggle="emit('toggle-month', group.monthKey)"
      />
    </ul>
    <button type="button" :disabled="!hasSelection" @click="emit('create')">
      Créer les playlists sélectionnées
    </button>
  </div>
</template>

<style scoped>
.month-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
}

button {
  padding: 0.6rem 1.25rem;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
