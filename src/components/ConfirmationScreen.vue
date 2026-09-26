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
      <li v-for="result in results" :key="result.monthKey">
        <template v-if="result.success">
          ✅
          <a :href="result.playlistUrl!" target="_blank" rel="noopener">{{
            result.playlistName
          }}</a>
        </template>
        <template v-else> ❌ {{ result.playlistName }} — {{ result.errorMessage }} </template>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.result-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
}

.result-list li {
  padding: 0.35rem 0;
}
</style>
