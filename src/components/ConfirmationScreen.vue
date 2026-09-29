<script setup lang="ts">
import type { PlaylistCreationResult } from '@/types/spotify'

defineProps<{
  results: PlaylistCreationResult[]
}>()
</script>

<template>
  <div class="confirmation-screen">
    <h2>Playlists créées</h2>
    <ul class="result-list">
      <li v-for="result in results" :key="result.groupKey" class="result-item">
        <template v-if="result.success">
          <span class="icon success">✓</span>
          <a :href="result.playlistUrl!" target="_blank" rel="noopener">{{
            result.playlistName
          }}</a>
        </template>
        <template v-else>
          <span class="icon failure">✕</span>
          <span>{{ result.playlistName }} — {{ result.errorMessage }}</span>
        </template>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.result-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1rem;
  border-radius: 10px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
}

.icon {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  flex-shrink: 0;
  color: white;
}

.icon.success {
  background: hsla(160, 100%, 37%, 1);
}

.icon.failure {
  background: #e0245e;
}
</style>
