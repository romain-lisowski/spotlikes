import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import {
  createPlaylist,
  addTracksToPlaylist,
  uploadPlaylistCoverImage,
} from '@/services/spotifyApi'
import { formatPlaylistName } from '@/utils/formatPlaylistName'
import { generateCoverImageBase64 } from '@/utils/generateCoverImage'
import { genreKeyOf, isNationalityGenre } from '@/utils/groupByGenre'
import { TokenExpiredError } from '@/utils/errors'
import { useAuthStore } from './auth'
import { useLikesStore } from './likes'
import type { PlaylistCreationResult, TrackGroup } from '@/types/spotify'

const DEFAULT_SELECTION_MIN_TRACKS = 20
const QUARTER_KEY_PATTERN = /^\d{4}-Q[1-4]$/

function isSelectableByDefault(group: TrackGroup): boolean {
  if (group.tracks.length <= DEFAULT_SELECTION_MIN_TRACKS) return false
  if (QUARTER_KEY_PATTERN.test(group.key)) return true
  return !isNationalityGenre(genreKeyOf(group.key))
}

export const usePlaylistsStore = defineStore('playlists', () => {
  const selectedGroups = ref<Set<string>>(new Set())
  const nameOverrides = ref<Map<string, string>>(new Map())
  const excludedTracks = ref<Map<string, Set<string>>>(new Map())
  const createdGroupKeys = ref<Set<string>>(new Set())
  const results = ref<PlaylistCreationResult[]>([])

  const likesStore = useLikesStore()

  // Au chargement des likes, on sélectionne par défaut les groupes de plus de
  // 20 titres qui ne sont pas déjà créés — et on repart d'un nommage/exclusions
  // propres.
  watch(
    () => likesStore.groups,
    (groups) => {
      selectedGroups.value = new Set(
        groups
          .filter((group) => !createdGroupKeys.value.has(group.key) && isSelectableByDefault(group))
          .map((group) => group.key),
      )
      nameOverrides.value.clear()
      excludedTracks.value.clear()
    },
    { flush: 'sync', immediate: true },
  )

  function isGroupAlreadyCreated(groupKey: string): boolean {
    return createdGroupKeys.value.has(groupKey)
  }

  function toggleGroup(groupKey: string): void {
    if (isGroupAlreadyCreated(groupKey)) return
    if (selectedGroups.value.has(groupKey)) {
      selectedGroups.value.delete(groupKey)
    } else {
      selectedGroups.value.add(groupKey)
    }
  }

  function getPlaylistName(group: TrackGroup): string {
    return nameOverrides.value.get(group.key) || formatPlaylistName(group)
  }

  function setPlaylistName(groupKey: string, name: string): void {
    if (name.trim()) {
      nameOverrides.value.set(groupKey, name)
    } else {
      nameOverrides.value.delete(groupKey)
    }
  }

  function isTrackExcluded(groupKey: string, trackId: string): boolean {
    return excludedTracks.value.get(groupKey)?.has(trackId) ?? false
  }

  function toggleTrackExclusion(groupKey: string, trackId: string): void {
    const excluded = excludedTracks.value.get(groupKey) ?? new Set<string>()
    if (excluded.has(trackId)) {
      excluded.delete(trackId)
    } else {
      excluded.add(trackId)
    }
    excludedTracks.value.set(groupKey, excluded)
  }

  async function createSelected(): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.accessToken) {
      throw new Error('Utilisateur non authentifié')
    }

    const accessToken = authStore.accessToken
    const groupsToCreate = likesStore.groups.filter(
      (group) => selectedGroups.value.has(group.key) && !isGroupAlreadyCreated(group.key),
    )

    results.value = []

    for (const group of groupsToCreate) {
      const playlistName = getPlaylistName(group)
      const tracksToAdd = group.tracks.filter((track) => !isTrackExcluded(group.key, track.id))
      try {
        const playlist = await createPlaylist(accessToken, playlistName)
        await addTracksToPlaylist(
          accessToken,
          playlist.id,
          tracksToAdd.map((track) => track.uri),
        )
        try {
          const coverImage = generateCoverImageBase64(group.key, playlistName)
          await uploadPlaylistCoverImage(accessToken, playlist.id, coverImage)
        } catch (coverError) {
          if (coverError instanceof TokenExpiredError) {
            throw coverError
          }
          // La cover est un bonus cosmétique : un échec ne doit pas faire
          // échouer la création de la playlist, déjà réussie à ce stade.
        }
        createdGroupKeys.value.add(group.key)
        selectedGroups.value.delete(group.key)
        results.value.push({
          groupKey: group.key,
          playlistName,
          playlistUrl: playlist.external_urls.spotify,
          success: true,
        })
      } catch (error) {
        if (error instanceof TokenExpiredError) {
          throw error
        }
        results.value.push({
          groupKey: group.key,
          playlistName,
          playlistUrl: null,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Erreur inconnue',
        })
      }
    }
  }

  return {
    selectedGroups,
    results,
    isGroupAlreadyCreated,
    toggleGroup,
    getPlaylistName,
    setPlaylistName,
    isTrackExcluded,
    toggleTrackExclusion,
    createSelected,
  }
})
