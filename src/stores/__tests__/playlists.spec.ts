import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlaylistsStore } from '../playlists'
import { useAuthStore } from '../auth'
import { useLikesStore } from '../likes'
import { TokenExpiredError } from '@/utils/errors'
import type { LikedTrack } from '@/types/spotify'
import type { SpotifyPlaylistObject } from '@/types/spotify-api'

vi.mock('@/services/spotifyApi', () => ({
  createPlaylist: vi.fn<(accessToken: string, name: string) => Promise<SpotifyPlaylistObject>>(),
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
  generateCoverImageBase64:
    vi.fn<(seed: string, title: string, kind: 'genre' | 'year') => string>(),
}))

import {
  createPlaylist,
  addTracksToPlaylist,
  uploadPlaylistCoverImage,
} from '@/services/spotifyApi'
import { fetchArtistsGenres } from '@/services/lastfmApi'
import { generateCoverImageBase64 } from '@/utils/generateCoverImage'
import { formatPlaylistName } from '@/utils/formatPlaylistName'

const Y2026_GROUP = { key: '2026', label: '2026', tracks: [] }
const defaultY2026Name = formatPlaylistName(Y2026_GROUP)

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

function manyTracks(count: number, addedAt: string): LikedTrack[] {
  return Array.from({ length: count }, (_, index) => likedTrack(`${addedAt}-${index}`, addedAt))
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  vi.mocked(fetchArtistsGenres).mockResolvedValue(new Map())
  vi.mocked(generateCoverImageBase64).mockReturnValue('base64-cover')
  vi.mocked(uploadPlaylistCoverImage).mockResolvedValue(undefined)

  useAuthStore().accessToken = 'token'
  useAuthStore().user = { id: 'user1', displayName: 'Rom' }
  // Deux petits groupes (1 titre chacun, années différentes) : sous le seuil
  // de sélection par défaut (20), donc non sélectionnés automatiquement —
  // pratique pour la plupart des tests, qui sélectionnent explicitement ce
  // qu'ils testent.
  useLikesStore().tracks = [
    likedTrack('1', '2026-09-01T00:00:00Z'),
    likedTrack('2', '2025-04-01T00:00:00Z'),
  ]
})

describe('sélection par défaut', () => {
  it('ne sélectionne pas les groupes de 20 titres ou moins', () => {
    const store = usePlaylistsStore()
    expect(store.selectedGroups.size).toBe(0)
  })

  it('sélectionne par défaut les groupes de plus de 20 titres', () => {
    useLikesStore().tracks = manyTracks(21, '2026-09-01T00:00:00Z')
    const store = usePlaylistsStore()
    expect(store.selectedGroups.has('2026')).toBe(true)
  })

  it('ne sélectionne pas un groupe d’exactement 20 titres', () => {
    useLikesStore().tracks = manyTracks(20, '2026-09-01T00:00:00Z')
    const store = usePlaylistsStore()
    expect(store.selectedGroups.has('2026')).toBe(false)
  })
})

describe('selectAll / deselectAll', () => {
  it('selectAll sélectionne les groupes donnés, sauf ceux déjà créés', async () => {
    vi.mocked(createPlaylist).mockResolvedValue({
      id: 'pl-2026',
      external_urls: { spotify: 'https://open.spotify.com/pl-2026' },
    })
    vi.mocked(addTracksToPlaylist).mockResolvedValue(undefined)

    const store = usePlaylistsStore()
    store.toggleGroup('2026')
    await store.createSelected()

    store.selectAll(['2026', '2025'])

    expect(store.selectedGroups).toEqual(new Set(['2025']))
  })

  it('deselectAll vide la sélection', () => {
    const store = usePlaylistsStore()
    store.toggleGroup('2026')
    store.toggleGroup('2025')

    store.deselectAll()

    expect(store.selectedGroups.size).toBe(0)
  })
})

describe('usePlaylistsStore', () => {
  it('toggleGroup ajoute puis retire un groupe de la sélection', () => {
    const store = usePlaylistsStore()
    expect(store.selectedGroups.has('2026')).toBe(false)

    store.toggleGroup('2026')
    expect(store.selectedGroups.has('2026')).toBe(true)

    store.toggleGroup('2026')
    expect(store.selectedGroups.has('2026')).toBe(false)
  })

  it('la sélection, les renommages et les exclusions sont réinitialisés quand les likes sont rechargés', async () => {
    const likesStore = useLikesStore()
    const store = usePlaylistsStore()

    store.toggleGroup('2026')
    store.setPlaylistName('2026', 'Mon nom perso')
    store.toggleTrackExclusion('2026', '1')
    expect(store.selectedGroups.size).toBe(1)

    likesStore.tracks = manyTracks(25, '2030-01-01T00:00:00Z')

    expect(store.selectedGroups).toEqual(new Set(['2030']))
    expect(store.getPlaylistName(Y2026_GROUP)).toBe(defaultY2026Name)
    expect(store.isTrackExcluded('2026', '1')).toBe(false)
  })

  it('getPlaylistName retourne le nom par défaut tant qu’aucun renommage n’a été fait', () => {
    const store = usePlaylistsStore()
    expect(store.getPlaylistName(Y2026_GROUP)).toBe(defaultY2026Name)
  })

  it('setPlaylistName permet de personnaliser le nom, et un nom vide restaure le nom par défaut', () => {
    const store = usePlaylistsStore()

    store.setPlaylistName('2026', 'Été chill')
    expect(store.getPlaylistName(Y2026_GROUP)).toBe('Été chill')

    store.setPlaylistName('2026', '   ')
    expect(store.getPlaylistName(Y2026_GROUP)).toBe(defaultY2026Name)
  })

  it('toggleTrackExclusion bascule l’exclusion d’un titre pour un groupe donné', () => {
    const store = usePlaylistsStore()

    expect(store.isTrackExcluded('2026', '1')).toBe(false)

    store.toggleTrackExclusion('2026', '1')
    expect(store.isTrackExcluded('2026', '1')).toBe(true)

    store.toggleTrackExclusion('2026', '1')
    expect(store.isTrackExcluded('2026', '1')).toBe(false)
  })

  it('createSelected crée une playlist par groupe sélectionné et enregistre le résultat', async () => {
    vi.mocked(createPlaylist).mockResolvedValue({
      id: 'pl-2026',
      external_urls: { spotify: 'https://open.spotify.com/pl-2026' },
    })
    vi.mocked(addTracksToPlaylist).mockResolvedValue(undefined)

    const store = usePlaylistsStore()
    store.toggleGroup('2026')
    await store.createSelected()

    expect(createPlaylist).toHaveBeenCalledWith('token', defaultY2026Name)
    expect(addTracksToPlaylist).toHaveBeenCalledWith('token', 'pl-2026', ['spotify:track:1'])
    expect(generateCoverImageBase64).toHaveBeenCalledWith('2026', defaultY2026Name, 'year')
    expect(uploadPlaylistCoverImage).toHaveBeenCalledWith('token', 'pl-2026', 'base64-cover')
    expect(store.results).toEqual([
      {
        groupKey: '2026',
        playlistName: defaultY2026Name,
        playlistUrl: 'https://open.spotify.com/pl-2026',
        success: true,
      },
    ])
  })

  it('utilise le type de cover "genre" pour un groupe par genre', async () => {
    vi.mocked(fetchArtistsGenres).mockResolvedValue(new Map([['artist-1', ['indie pop']]]))
    const likesStore = useLikesStore()
    await likesStore.setGroupingMode('genre')

    vi.mocked(createPlaylist).mockResolvedValue({
      id: 'pl-genre',
      external_urls: { spotify: 'https://open.spotify.com/pl-genre' },
    })
    vi.mocked(addTracksToPlaylist).mockResolvedValue(undefined)

    const store = usePlaylistsStore()
    store.toggleGroup('Autres')
    await store.createSelected()

    expect(generateCoverImageBase64).toHaveBeenCalledWith('Autres', expect.any(String), 'genre')
  })

  it('un échec d’upload de cover n’empêche pas la playlist d’être marquée comme créée', async () => {
    vi.mocked(createPlaylist).mockResolvedValue({
      id: 'pl-2026',
      external_urls: { spotify: 'https://open.spotify.com/pl-2026' },
    })
    vi.mocked(addTracksToPlaylist).mockResolvedValue(undefined)
    vi.mocked(uploadPlaylistCoverImage).mockRejectedValue(new Error('cover failed'))

    const store = usePlaylistsStore()
    store.toggleGroup('2026')
    await store.createSelected()

    expect(store.results[0]?.success).toBe(true)
    expect(store.isGroupAlreadyCreated('2026')).toBe(true)
  })

  it('marque le groupe comme déjà créé et empêche une nouvelle création', async () => {
    vi.mocked(createPlaylist).mockResolvedValue({
      id: 'pl-2026',
      external_urls: { spotify: 'https://open.spotify.com/pl-2026' },
    })
    vi.mocked(addTracksToPlaylist).mockResolvedValue(undefined)

    const store = usePlaylistsStore()
    store.toggleGroup('2026')
    await store.createSelected()

    expect(store.isGroupAlreadyCreated('2026')).toBe(true)
    expect(store.selectedGroups.has('2026')).toBe(false)

    // toggleGroup ne doit plus pouvoir le resélectionner
    store.toggleGroup('2026')
    expect(store.selectedGroups.has('2026')).toBe(false)

    // un appel createSelected supplémentaire ne recrée pas la playlist
    store.selectedGroups.add('2026')
    await store.createSelected()
    expect(createPlaylist).toHaveBeenCalledTimes(1)
  })

  it('createSelected utilise le nom personnalisé quand il a été défini', async () => {
    vi.mocked(createPlaylist).mockResolvedValue({
      id: 'pl-2026',
      external_urls: { spotify: 'https://open.spotify.com/pl-2026' },
    })
    vi.mocked(addTracksToPlaylist).mockResolvedValue(undefined)

    const store = usePlaylistsStore()
    store.toggleGroup('2026')
    store.setPlaylistName('2026', 'Été chill')
    await store.createSelected()

    expect(createPlaylist).toHaveBeenCalledWith('token', 'Été chill')
  })

  it('createSelected exclut les titres décochés de la playlist créée', async () => {
    vi.mocked(createPlaylist).mockResolvedValue({
      id: 'pl-2026',
      external_urls: { spotify: 'https://open.spotify.com/pl-2026' },
    })
    vi.mocked(addTracksToPlaylist).mockResolvedValue(undefined)

    const store = usePlaylistsStore()
    store.toggleGroup('2026')
    store.toggleTrackExclusion('2026', '1')
    await store.createSelected()

    expect(addTracksToPlaylist).toHaveBeenCalledWith('token', 'pl-2026', [])
  })

  it('continue avec les groupes suivants si la création échoue pour un groupe', async () => {
    vi.mocked(createPlaylist)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({
        id: 'pl-2025',
        external_urls: { spotify: 'https://open.spotify.com/pl-2025' },
      })
    vi.mocked(addTracksToPlaylist).mockResolvedValue(undefined)

    const store = usePlaylistsStore()
    store.toggleGroup('2026')
    store.toggleGroup('2025')
    await store.createSelected()

    expect(store.results).toHaveLength(2)
    expect(store.results.find((r) => r.groupKey === '2026')?.success).toBe(false)
    expect(store.results.find((r) => r.groupKey === '2025')?.success).toBe(true)
  })

  it('propage une TokenExpiredError sans traiter les groupes suivants', async () => {
    vi.mocked(createPlaylist).mockRejectedValue(new TokenExpiredError())

    const store = usePlaylistsStore()
    store.toggleGroup('2026')
    store.toggleGroup('2025')

    await expect(store.createSelected()).rejects.toThrow(TokenExpiredError)
    expect(createPlaylist).toHaveBeenCalledTimes(1)
  })
})
