import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLikesStore } from '../likes'
import { useAuthStore } from '../auth'
import type { LikedTrack } from '@/types/spotify'

vi.mock('@/services/spotifyApi', () => ({
  fetchAllLikedTracks: vi.fn<(accessToken: string) => Promise<LikedTrack[]>>(),
}))

vi.mock('@/services/lastfmApi', () => ({
  fetchArtistsGenres:
    vi.fn<(artists: { id: string; name: string }[]) => Promise<Map<string, string[]>>>(),
}))

import { fetchAllLikedTracks } from '@/services/spotifyApi'
import { fetchArtistsGenres } from '@/services/lastfmApi'

function likedTrack(id: string, addedAt: string): LikedTrack {
  return {
    id,
    name: `T${id}`,
    artist: 'A',
    artistId: 'artist-1',
    primaryArtistName: 'A',
    previewUrl: null,
    uri: `spotify:track:${id}`,
    addedAt,
    genres: [],
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  vi.mocked(fetchArtistsGenres).mockResolvedValue(new Map())
})

describe('useLikesStore', () => {
  it('fetchAll lève une erreur si l’utilisateur n’est pas authentifié', async () => {
    const store = useLikesStore()
    await expect(store.fetchAll()).rejects.toThrow('Utilisateur non authentifié')
  })

  it('fetchAll récupère les titres et les expose regroupés par trimestre, sans appeler les genres', async () => {
    useAuthStore().accessToken = 'token'
    vi.mocked(fetchAllLikedTracks).mockResolvedValue([likedTrack('1', '2026-09-01T00:00:00Z')])

    const store = useLikesStore()
    await store.fetchAll()

    expect(store.tracks).toHaveLength(1)
    expect(fetchArtistsGenres).not.toHaveBeenCalled()

    expect(store.groups).toHaveLength(1)
    expect(store.groups[0]?.key).toBe('2026-Q3')
  })

  it('setGroupingMode vers "genre" déclenche l’enrichissement des genres, une seule fois', async () => {
    useAuthStore().accessToken = 'token'
    vi.mocked(fetchAllLikedTracks).mockResolvedValue([likedTrack('1', '2026-09-01T00:00:00Z')])
    vi.mocked(fetchArtistsGenres).mockResolvedValue(new Map([['artist-1', ['indie pop']]]))

    const store = useLikesStore()
    await store.fetchAll()
    await store.setGroupingMode('genre')

    expect(store.groups[0]?.key).toBe('indie pop')
    expect(fetchArtistsGenres).toHaveBeenCalledWith([{ id: 'artist-1', name: 'A' }])

    await store.setGroupingMode('quarter')
    await store.setGroupingMode('genre')
    expect(fetchArtistsGenres).toHaveBeenCalledTimes(1)
  })

  it('setGroupingMode vers "quarter" n’appelle pas les genres', async () => {
    useAuthStore().accessToken = 'token'
    vi.mocked(fetchAllLikedTracks).mockResolvedValue([likedTrack('1', '2026-09-01T00:00:00Z')])

    const store = useLikesStore()
    await store.fetchAll()
    await store.setGroupingMode('quarter')

    expect(fetchArtistsGenres).not.toHaveBeenCalled()
  })
})
