import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlaylistsStore } from '../playlists'
import { useAuthStore } from '../auth'
import { useLikesStore } from '../likes'
import { TokenExpiredError } from '@/utils/errors'
import type { LikedTrack } from '@/types/spotify'
import type { SpotifyPlaylistObject } from '@/types/spotify-api'

vi.mock('@/services/spotifyApi', () => ({
  createPlaylist:
    vi.fn<(accessToken: string, userId: string, name: string) => Promise<SpotifyPlaylistObject>>(),
  addTracksToPlaylist:
    vi.fn<(accessToken: string, playlistId: string, uris: string[]) => Promise<void>>(),
}))

import { createPlaylist, addTracksToPlaylist } from '@/services/spotifyApi'

function likedTrack(id: string, addedAt: string): LikedTrack {
  return { id, name: `Track ${id}`, artist: 'Artist', uri: `spotify:track:${id}`, addedAt }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()

  useAuthStore().accessToken = 'token'
  useAuthStore().user = { id: 'user1', displayName: 'Rom' }
  useLikesStore().tracks = [
    likedTrack('1', '2026-09-01T00:00:00Z'),
    likedTrack('2', '2026-08-01T00:00:00Z'),
  ]
})

describe('usePlaylistsStore', () => {
  it('toggleMonth ajoute puis retire un mois de la sélection', () => {
    const store = usePlaylistsStore()

    store.toggleMonth('2026-09')
    expect(store.selectedMonths.has('2026-09')).toBe(true)

    store.toggleMonth('2026-09')
    expect(store.selectedMonths.has('2026-09')).toBe(false)
  })

  it('createSelected crée une playlist par mois sélectionné et enregistre le résultat', async () => {
    vi.mocked(createPlaylist).mockResolvedValue({
      id: 'pl-sept',
      external_urls: { spotify: 'https://open.spotify.com/pl-sept' },
    })
    vi.mocked(addTracksToPlaylist).mockResolvedValue(undefined)

    const store = usePlaylistsStore()
    store.toggleMonth('2026-09')
    await store.createSelected()

    expect(createPlaylist).toHaveBeenCalledWith('token', 'user1', 'Likes — septembre 2026')
    expect(addTracksToPlaylist).toHaveBeenCalledWith('token', 'pl-sept', ['spotify:track:1'])
    expect(store.results).toEqual([
      {
        monthKey: '2026-09',
        playlistName: 'Likes — septembre 2026',
        playlistUrl: 'https://open.spotify.com/pl-sept',
        success: true,
      },
    ])
  })

  it('continue avec les mois suivants si la création échoue pour un mois', async () => {
    vi.mocked(createPlaylist)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({
        id: 'pl-aug',
        external_urls: { spotify: 'https://open.spotify.com/pl-aug' },
      })
    vi.mocked(addTracksToPlaylist).mockResolvedValue(undefined)

    const store = usePlaylistsStore()
    store.toggleMonth('2026-09')
    store.toggleMonth('2026-08')
    await store.createSelected()

    expect(store.results).toHaveLength(2)
    expect(store.results.find((r) => r.monthKey === '2026-09')?.success).toBe(false)
    expect(store.results.find((r) => r.monthKey === '2026-08')?.success).toBe(true)
  })

  it('propage une TokenExpiredError sans traiter les mois suivants', async () => {
    vi.mocked(createPlaylist).mockRejectedValue(new TokenExpiredError())

    const store = usePlaylistsStore()
    store.toggleMonth('2026-09')
    store.toggleMonth('2026-08')

    await expect(store.createSelected()).rejects.toThrow(TokenExpiredError)
    expect(createPlaylist).toHaveBeenCalledTimes(1)
  })
})
