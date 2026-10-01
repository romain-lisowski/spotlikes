import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchAllLikedTracks } from '@/services/spotifyApi'
import { fetchArtistsGenres } from '@/services/lastfmApi'
import { groupByYear } from '@/utils/groupByYear'
import { groupByGenre } from '@/utils/groupByGenre'
import { useAuthStore } from './auth'
import type { GroupingMode, LikedTrack } from '@/types/spotify'

export const useLikesStore = defineStore('likes', () => {
  const tracks = ref<LikedTrack[]>([])
  const groupingMode = ref<GroupingMode>('year')
  const genresLoaded = ref(false)

  const groups = computed(() =>
    groupingMode.value === 'genre' ? groupByGenre(tracks.value) : groupByYear(tracks.value),
  )

  async function fetchAll(): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.accessToken) {
      throw new Error('Utilisateur non authentifié')
    }

    tracks.value = await fetchAllLikedTracks(authStore.accessToken)
    genresLoaded.value = false
  }

  async function ensureGenresLoaded(): Promise<void> {
    if (genresLoaded.value) return

    const uniqueArtists = Array.from(
      new Map(tracks.value.map((track) => [track.artistId, track.primaryArtistName])).entries(),
    ).map(([id, name]) => ({ id, name }))

    const genresByArtistId = await fetchArtistsGenres(uniqueArtists)

    tracks.value = tracks.value.map((track) => ({
      ...track,
      genres: genresByArtistId.get(track.artistId) ?? [],
    }))
    genresLoaded.value = true
  }

  async function setGroupingMode(mode: GroupingMode): Promise<void> {
    if (mode === 'genre') {
      await ensureGenresLoaded()
    }
    groupingMode.value = mode
  }

  return { tracks, groupingMode, groups, fetchAll, setGroupingMode }
})
