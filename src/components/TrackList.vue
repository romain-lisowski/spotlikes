<script setup lang="ts">
import type { LikedTrack } from '@/types/spotify'
import { usePlaylistsStore } from '@/stores/playlists'
import { usePlayerStore } from '@/stores/player'

defineProps<{
  tracks: LikedTrack[]
  groupKey: string
}>()

const playlistsStore = usePlaylistsStore()
const playerStore = usePlayerStore()
</script>

<template>
  <ul class="track-list">
    <li v-for="track in tracks" :key="track.id" class="track-row">
      <input
        type="checkbox"
        :checked="!playlistsStore.isTrackExcluded(groupKey, track.id)"
        title="Inclure ce titre dans la playlist"
        @change="playlistsStore.toggleTrackExclusion(groupKey, track.id)"
      />
      <button
        type="button"
        class="play-button"
        :class="{ playing: playerStore.currentTrackId === track.id }"
        :disabled="!track.previewUrl"
        :title="track.previewUrl ? 'Écouter un extrait' : 'Aucun extrait disponible'"
        @click="playerStore.toggle(track)"
      >
        {{ playerStore.currentTrackId === track.id ? '⏸' : '▶' }}
      </button>
      <span
        class="track-label"
        :class="{ excluded: playlistsStore.isTrackExcluded(groupKey, track.id) }"
      >
        {{ track.artist }} — {{ track.name }}
        <span v-if="track.genres.length" class="genres">({{ track.genres.join(', ') }})</span>
      </span>
    </li>
  </ul>
</template>

<style scoped>
.track-list {
  list-style: none;
  padding: 0;
  margin: 1.1rem 0 0;
  font-size: 0.92rem;
  color: var(--color-text);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.track-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.45rem 0.5rem;
  border-radius: 8px;
}

.track-row:hover {
  background: var(--color-background-mute);
}

.track-row input[type='checkbox'] {
  width: 1.05rem;
  height: 1.05rem;
  accent-color: hsla(160, 100%, 37%, 1);
  flex-shrink: 0;
}

.play-button {
  border: none;
  background: var(--color-background-mute);
  color: var(--color-text);
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.75rem;
  line-height: 1;
  flex-shrink: 0;
}

.play-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.play-button.playing {
  background: hsla(160, 100%, 37%, 1);
  color: white;
}

.track-label.excluded {
  text-decoration: line-through;
  opacity: 0.5;
}

.genres {
  color: var(--color-text);
  opacity: 0.6;
  font-size: 0.8rem;
}
</style>
