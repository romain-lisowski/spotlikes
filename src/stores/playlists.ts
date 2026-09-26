import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createPlaylist, addTracksToPlaylist } from '@/services/spotifyApi'
import { formatPlaylistName } from '@/utils/formatPlaylistName'
import { TokenExpiredError } from '@/utils/errors'
import { useAuthStore } from './auth'
import { useLikesStore } from './likes'
import type { PlaylistCreationResult } from '@/types/spotify'

export const usePlaylistsStore = defineStore('playlists', () => {
  const selectedMonths = ref<Set<string>>(new Set())
  const results = ref<PlaylistCreationResult[]>([])

  function toggleMonth(monthKey: string): void {
    if (selectedMonths.value.has(monthKey)) {
      selectedMonths.value.delete(monthKey)
    } else {
      selectedMonths.value.add(monthKey)
    }
  }

  async function createSelected(): Promise<void> {
    const authStore = useAuthStore()
    const likesStore = useLikesStore()
    if (!authStore.accessToken || !authStore.user) {
      throw new Error('Utilisateur non authentifié')
    }

    const accessToken = authStore.accessToken
    const userId = authStore.user.id
    const monthGroupsToCreate = likesStore.monthGroups.filter((group) =>
      selectedMonths.value.has(group.monthKey),
    )

    results.value = []

    for (const group of monthGroupsToCreate) {
      const playlistName = formatPlaylistName(group.monthKey)
      try {
        const playlist = await createPlaylist(accessToken, userId, playlistName)
        await addTracksToPlaylist(
          accessToken,
          playlist.id,
          group.tracks.map((track) => track.uri),
        )
        results.value.push({
          monthKey: group.monthKey,
          playlistName,
          playlistUrl: playlist.external_urls.spotify,
          success: true,
        })
      } catch (error) {
        if (error instanceof TokenExpiredError) {
          throw error
        }
        results.value.push({
          monthKey: group.monthKey,
          playlistName,
          playlistUrl: null,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Erreur inconnue',
        })
      }
    }
  }

  return { selectedMonths, results, toggleMonth, createSelected }
})
