<script setup lang="ts">
import type { LikedTrack } from '@/types/spotify'

defineProps<{
  tracks: LikedTrack[]
}>()
</script>

<template>
  <ul class="track-list">
    <li v-for="track in tracks" :key="track.id">{{ track.artist }} — {{ track.name }}</li>
  </ul>
</template>

<style scoped>
.track-list {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 1.5rem;
  font-size: 0.9rem;
  color: var(--color-text);
}

.track-list li {
  padding: 0.15rem 0;
}
</style>
