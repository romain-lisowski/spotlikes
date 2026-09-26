import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchAllLikedTracks } from '@/services/spotifyApi'
import { groupByMonth } from '@/utils/groupByMonth'
import { useAuthStore } from './auth'
import type { LikedTrack } from '@/types/spotify'

export const useLikesStore = defineStore('likes', () => {
  const tracks = ref<LikedTrack[]>([])

  const monthGroups = computed(() => groupByMonth(tracks.value))

  async function fetchAll(): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.accessToken) {
      throw new Error('Utilisateur non authentifié')
    }
    tracks.value = await fetchAllLikedTracks(authStore.accessToken)
  }

  return { tracks, monthGroups, fetchAll }
})
