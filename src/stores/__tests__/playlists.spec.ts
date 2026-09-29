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
  uploadPlaylistCoverImage:
    vi.fn<(accessToken: string, playlistId: string, base64Jpeg: string) => Promise<void>>(),
}))

vi.mock('@/services/lastfmApi', () => ({
  fetchArtistsGenres:
    vi.fn<(artists: { id: string; name: string }[]) => Promise<Map<string, string[]>>>(),
}))

vi.mock('@/utils/generateCoverImage', () => ({
  generateCoverImageBase64: vi.fn<(seed: string, title: string) => string>(),
}))

import {
  createPlaylist,
  addTracksToPlaylist,
  uploadPlaylistCoverImage,
} from '@/services/spotifyApi'
import { fetchArtistsGenres } from '@/services/lastfmApi'
import { generateCoverImageBase64 } from '@/utils/generateCoverImage'
import { formatPlaylistName } from '@/utils/formatPlaylistName'

const Q3_GROUP = { key: '2026-Q3', label: 'T3 2026', tracks: [] }
const defaultQ3Name = formatPlaylistName(Q3_GROUP)

function likedTrack(id: string, addedAt: string): LikedTrack {
  return {
    id,
    name: `Track ${id}`,
    artist: 'Artist',
    artistId: 'artist-1',
    primaryArtistName: 'Artist',
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
  vi.mocked(generateCoverImageBase64).mockReturnValue('base64-cover')
  vi.mocked(uploadPlaylistCoverImage).mockResolvedValue(undefined)

  useAuthStore().accessToken = 'token'
  useAuthStore().user = { id: 'user1', displayName: 'Rom' }
  useLikesStore().tracks = [
    likedTrack('1', '2026-09-01T00:00:00Z'),
    likedTrack('2', '2026-04-01T00:00:00Z'),
  ]
})

describe('usePlaylistsStore', () => {
  it('sélectionne tous les groupes par défaut', () => {
    const store = usePlaylistsStore()
    expect(store.selectedGroups).toEqual(new Set(['2026-Q3', '2026-Q2']))
  })

  it('toggleGroup retire puis rajoute un groupe déjà sélectionné par défaut', () => {
    const store = usePlaylistsStore()
    expect(store.selectedGroups.has('2026-Q3')).toBe(true)

    store.toggleGroup('2026-Q3')
    expect(store.selectedGroups.has('2026-Q3')).toBe(false)

    store.toggleGroup('2026-Q3')
    expect(store.selectedGroups.has('2026-Q3')).toBe(true)
  })

  it('tous les groupes du nouveau mode sont sélectionnés par défaut, et les renommages/exclusions sont réinitialisés', async () => {
    const likesStore = useLikesStore()
    const store = usePlaylistsStore()

    store.setPlaylistName('2026-Q3', 'Mon nom perso')
    store.toggleTrackExclusion('2026-Q3', '1')

    await likesStore.setGroupingMode('genre')

    // les 2 titres sont sans genre -> un seul groupe "Genre inconnu", sélectionné par défaut
    expect(store.selectedGroups.size).toBe(1)
    expect(store.getPlaylistName(Q3_GROUP)).toBe(defaultQ3Name)
    expect(store.isTrackExcluded('2026-Q3', '1')).toBe(false)
  })

  it('getPlaylistName retourne le nom par défaut tant qu’aucun renommage n’a été fait', () => {
    const store = usePlaylistsStore()
    expect(store.getPlaylistName(Q3_GROUP)).toBe(defaultQ3Name)
  })

  it('setPlaylistName permet de personnaliser le nom, et un nom vide restaure le nom par défaut', () => {
    const store = usePlaylistsStore()

    store.setPlaylistName('2026-Q3', 'Été chill')
    expect(store.getPlaylistName(Q3_GROUP)).toBe('Été chill')

    store.setPlaylistName('2026-Q3', '   ')
    expect(store.getPlaylistName(Q3_GROUP)).toBe(defaultQ3Name)
  })

  it('toggleTrackExclusion bascule l’exclusion d’un titre pour un groupe donné', () => {
    const store = usePlaylistsStore()

    expect(store.isTrackExcluded('2026-Q3', '1')).toBe(false)

    store.toggleTrackExclusion('2026-Q3', '1')
    expect(store.isTrackExcluded('2026-Q3', '1')).toBe(true)

    store.toggleTrackExclusion('2026-Q3', '1')
    expect(store.isTrackExcluded('2026-Q3', '1')).toBe(false)
  })

  it('createSelected crée une playlist par groupe sélectionné et enregistre le résultat', async () => {
    vi.mocked(createPlaylist).mockResolvedValue({
      id: 'pl-q3',
      external_urls: { spotify: 'https://open.spotify.com/pl-q3' },
    })
    vi.mocked(addTracksToPlaylist).mockResolvedValue(undefined)

    const store = usePlaylistsStore()
    store.toggleGroup('2026-Q2') // ne garder que 2026-Q3 sélectionné
    await store.createSelected()

    expect(createPlaylist).toHaveBeenCalledWith('token', 'user1', defaultQ3Name)
    expect(addTracksToPlaylist).toHaveBeenCalledWith('token', 'pl-q3', ['spotify:track:1'])
    expect(generateCoverImageBase64).toHaveBeenCalledWith('2026-Q3', defaultQ3Name)
    expect(uploadPlaylistCoverImage).toHaveBeenCalledWith('token', 'pl-q3', 'base64-cover')
    expect(store.results).toEqual([
      {
        groupKey: '2026-Q3',
        playlistName: defaultQ3Name,
        playlistUrl: 'https://open.spotify.com/pl-q3',
        success: true,
      },
    ])
  })

  it('un échec d’upload de cover n’empêche pas la playlist d’être marquée comme créée', async () => {
    vi.mocked(createPlaylist).mockResolvedValue({
      id: 'pl-q3',
      external_urls: { spotify: 'https://open.spotify.com/pl-q3' },
    })
    vi.mocked(addTracksToPlaylist).mockResolvedValue(undefined)
    vi.mocked(uploadPlaylistCoverImage).mockRejectedValue(new Error('cover failed'))

    const store = usePlaylistsStore()
    store.toggleGroup('2026-Q2')
    await store.createSelected()

    expect(store.results[0]?.success).toBe(true)
    expect(store.isGroupAlreadyCreated('2026-Q3')).toBe(true)
  })

  it('marque le groupe comme déjà créé et empêche une nouvelle création', async () => {
    vi.mocked(createPlaylist).mockResolvedValue({
      id: 'pl-q3',
      external_urls: { spotify: 'https://open.spotify.com/pl-q3' },
    })
    vi.mocked(addTracksToPlaylist).mockResolvedValue(undefined)

    const store = usePlaylistsStore()
    store.toggleGroup('2026-Q2')
    await store.createSelected()

    expect(store.isGroupAlreadyCreated('2026-Q3')).toBe(true)
    expect(store.selectedGroups.has('2026-Q3')).toBe(false)

    // toggleGroup ne doit plus pouvoir le resélectionner
    store.toggleGroup('2026-Q3')
    expect(store.selectedGroups.has('2026-Q3')).toBe(false)

    // un appel createSelected supplémentaire ne recrée pas la playlist
    store.selectedGroups.add('2026-Q3')
    await store.createSelected()
    expect(createPlaylist).toHaveBeenCalledTimes(1)
  })

  it('createSelected utilise le nom personnalisé quand il a été défini', async () => {
    vi.mocked(createPlaylist).mockResolvedValue({
      id: 'pl-q3',
      external_urls: { spotify: 'https://open.spotify.com/pl-q3' },
    })
    vi.mocked(addTracksToPlaylist).mockResolvedValue(undefined)

    const store = usePlaylistsStore()
    store.toggleGroup('2026-Q2')
    store.setPlaylistName('2026-Q3', 'Été chill')
    await store.createSelected()

    expect(createPlaylist).toHaveBeenCalledWith('token', 'user1', 'Été chill')
  })

  it('createSelected exclut les titres décochés de la playlist créée', async () => {
    vi.mocked(createPlaylist).mockResolvedValue({
      id: 'pl-q3',
      external_urls: { spotify: 'https://open.spotify.com/pl-q3' },
    })
    vi.mocked(addTracksToPlaylist).mockResolvedValue(undefined)

    const store = usePlaylistsStore()
    store.toggleGroup('2026-Q2')
    store.toggleTrackExclusion('2026-Q3', '1')
    await store.createSelected()

    expect(addTracksToPlaylist).toHaveBeenCalledWith('token', 'pl-q3', [])
  })

  it('continue avec les groupes suivants si la création échoue pour un groupe', async () => {
    vi.mocked(createPlaylist)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({
        id: 'pl-q2',
        external_urls: { spotify: 'https://open.spotify.com/pl-q2' },
      })
    vi.mocked(addTracksToPlaylist).mockResolvedValue(undefined)

    const store = usePlaylistsStore()
    await store.createSelected()

    expect(store.results).toHaveLength(2)
    expect(store.results.find((r) => r.groupKey === '2026-Q3')?.success).toBe(false)
    expect(store.results.find((r) => r.groupKey === '2026-Q2')?.success).toBe(true)
  })

  it('propage une TokenExpiredError sans traiter les groupes suivants', async () => {
    vi.mocked(createPlaylist).mockRejectedValue(new TokenExpiredError())

    const store = usePlaylistsStore()

    await expect(store.createSelected()).rejects.toThrow(TokenExpiredError)
    expect(createPlaylist).toHaveBeenCalledTimes(1)
  })
})
