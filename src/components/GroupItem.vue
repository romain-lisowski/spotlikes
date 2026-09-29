<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TrackGroup } from '@/types/spotify'
import { usePlaylistsStore } from '@/stores/playlists'
import TrackList from './TrackList.vue'

const props = defineProps<{
  group: TrackGroup
}>()

const playlistsStore = usePlaylistsStore()
const expanded = ref(false)

const alreadyCreated = computed(() => playlistsStore.isGroupAlreadyCreated(props.group.key))
const createdResult = computed(() =>
  playlistsStore.results.find((result) => result.groupKey === props.group.key),
)
</script>

<template>
  <li
    class="group-item"
    :class="{
      selected: playlistsStore.selectedGroups.has(group.key),
      created: alreadyCreated,
    }"
  >
    <div class="row">
      <label class="select-label">
        <input
          type="checkbox"
          :checked="playlistsStore.selectedGroups.has(group.key)"
          :disabled="alreadyCreated"
          @change="playlistsStore.toggleGroup(group.key)"
        />
        <span class="group-label">{{ group.label }}</span>
        <span class="track-count">{{ group.tracks.length }} titres</span>
        <a
          v-if="alreadyCreated && createdResult?.playlistUrl"
          :href="createdResult.playlistUrl"
          target="_blank"
          rel="noopener"
          class="created-badge"
          @click.stop
        >
          ✓ Déjà créée
        </a>
      </label>
      <button type="button" class="expand-button" @click="expanded = !expanded">
        {{ expanded ? 'Masquer' : 'Voir les titres' }}
      </button>
    </div>
    <div v-if="!alreadyCreated" class="playlist-name-row">
      <label>
        Nom de la playlist
        <input
          type="text"
          class="playlist-name-input"
          :value="playlistsStore.getPlaylistName(props.group)"
          @input="
            playlistsStore.setPlaylistName(group.key, ($event.target as HTMLInputElement).value)
          "
        />
      </label>
    </div>
    <TrackList v-if="expanded" :tracks="group.tracks" :group-key="group.key" />
  </li>
</template>

<style scoped>
.group-item {
  padding: 1.4rem 1.5rem;
  margin-bottom: 1.1rem;
  border-radius: 14px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.group-item.selected {
  border-color: hsla(160, 100%, 37%, 1);
  box-shadow: 0 0 0 1px hsla(160, 100%, 37%, 1);
}

.group-item.created {
  opacity: 0.7;
}

.created-badge {
  font-size: 0.8rem;
  color: hsla(160, 100%, 37%, 1);
  font-weight: 600;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.select-label {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  cursor: pointer;
}

.select-label input[type='checkbox'] {
  width: 1.2rem;
  height: 1.2rem;
  accent-color: hsla(160, 100%, 37%, 1);
  flex-shrink: 0;
}

.group-label {
  font-weight: 700;
  font-size: 1.1rem;
}

.track-count {
  font-size: 0.85rem;
  opacity: 0.6;
}

.expand-button {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  color: hsla(160, 100%, 37%, 1);
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
}

.expand-button:hover {
  background: var(--color-background-mute);
}

.playlist-name-row {
  margin-top: 1rem;
  font-size: 0.85rem;
  opacity: 0.85;
}

.playlist-name-row label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.playlist-name-input {
  flex: 1;
  padding: 0.55rem 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.95rem;
}
</style>
