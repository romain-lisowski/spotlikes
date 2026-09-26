import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLikesStore } from '../likes'
import { useAuthStore } from '../auth'
import type { LikedTrack } from '@/types/spotify'

vi.mock('@/services/spotifyApi', () => ({
  fetchAllLikedTracks: vi.fn<(accessToken: string) => Promise<LikedTrack[]>>(),
}))

import { fetchAllLikedTracks } from '@/services/spotifyApi'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useLikesStore', () => {
  it('fetchAll lève une erreur si l’utilisateur n’est pas authentifié', async () => {
    const store = useLikesStore()
    await expect(store.fetchAll()).rejects.toThrow('Utilisateur non authentifié')
  })

  it('fetchAll récupère les titres et les expose regroupés par mois', async () => {
    useAuthStore().accessToken = 'token'
    vi.mocked(fetchAllLikedTracks).mockResolvedValue([
      { id: '1', name: 'T1', artist: 'A', uri: 'spotify:track:1', addedAt: '2026-09-01T00:00:00Z' },
    ])

    const store = useLikesStore()
    await store.fetchAll()

    expect(store.tracks).toHaveLength(1)
    expect(store.monthGroups).toHaveLength(1)
    expect(store.monthGroups[0]?.monthKey).toBe('2026-09')
  })
})
