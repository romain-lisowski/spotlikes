import { describe, it, expect, vi } from 'vitest'
import {
  getCurrentUser,
  fetchAllLikedTracks,
  addTracksToPlaylist,
  createPlaylist,
  uploadPlaylistCoverImage,
} from '../spotifyApi'
import { TokenExpiredError } from '@/utils/errors'

function savedTrackItem(id: string, addedAt: string, previewUrl: string | null = null) {
  return {
    added_at: addedAt,
    track: {
      id,
      name: `Track ${id}`,
      uri: `spotify:track:${id}`,
      artists: [{ id: 'artist-1', name: 'Artist' }],
      preview_url: previewUrl,
    },
  }
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response
}

describe('fetchAllLikedTracks', () => {
  it('rassemble les titres de toutes les pages jusqu’à next === null', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          items: [savedTrackItem('1', '2026-09-01T00:00:00Z')],
          next: 'https://api.spotify.com/v1/me/tracks?offset=50&limit=50',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          items: [savedTrackItem('2', '2026-09-02T00:00:00Z')],
          next: null,
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const tracks = await fetchAllLikedTracks('token')

    expect(tracks).toHaveLength(2)
    expect(tracks[0]).toEqual({
      id: '1',
      name: 'Track 1',
      artist: 'Artist',
      artistId: 'artist-1',
      primaryArtistName: 'Artist',
      uri: 'spotify:track:1',
      addedAt: '2026-09-01T00:00:00Z',
      genres: [],
      previewUrl: null,
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('capture l’URL d’aperçu du titre quand elle est fournie par Spotify', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse({
          items: [savedTrackItem('1', '2026-09-01T00:00:00Z', 'https://p.scdn.co/mp3-preview/abc')],
          next: null,
        }),
      ),
    )

    const tracks = await fetchAllLikedTracks('token')

    expect(tracks[0]?.previewUrl).toBe('https://p.scdn.co/mp3-preview/abc')
  })

  it('retourne une liste vide quand il n’y a aucun titre liké', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ items: [], next: null })),
    )

    const tracks = await fetchAllLikedTracks('token')

    expect(tracks).toEqual([])
  })

  it('lève une TokenExpiredError sur une réponse 401', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, false, 401)))

    await expect(fetchAllLikedTracks('token')).rejects.toThrow(TokenExpiredError)
  })
})

describe('rate limiting (429)', () => {
  it('réessaie automatiquement après une réponse 429 en respectant Retry-After', async () => {
    vi.useFakeTimers()
    try {
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({ 'Retry-After': '2' }),
        } as Response)
        .mockResolvedValueOnce(jsonResponse({ id: 'user1', display_name: 'Rom' }))
      vi.stubGlobal('fetch', fetchMock)

      const userPromise = getCurrentUser('token')
      await vi.advanceTimersByTimeAsync(2000)
      const user = await userPromise

      expect(user).toEqual({ id: 'user1', displayName: 'Rom' })
      expect(fetchMock).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('addTracksToPlaylist', () => {
  it('découpe les URIs en lots de 100 maximum par requête', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}))
    vi.stubGlobal('fetch', fetchMock)

    const uris = Array.from({ length: 250 }, (_, i) => `spotify:track:${i}`)
    await addTracksToPlaylist('token', 'playlist-id', uris)

    expect(fetchMock).toHaveBeenCalledTimes(3)
    const bodies = fetchMock.mock.calls.map(([, init]) => JSON.parse(init!.body as string).uris)
    expect(bodies.map((b: string[]) => b.length)).toEqual([100, 100, 50])
  })
})

describe('createPlaylist', () => {
  it('crée une playlist privée avec le nom fourni', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        jsonResponse({ id: 'pl1', external_urls: { spotify: 'https://open.spotify.com/pl1' } }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const playlist = await createPlaylist('token', 'Likes — septembre 2026')

    expect(playlist.id).toBe('pl1')
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.spotify.com/v1/me/playlists')
    const body = JSON.parse(init!.body as string)
    expect(body).toEqual({ name: 'Likes — septembre 2026', public: false })
  })
})

describe('uploadPlaylistCoverImage', () => {
  it('envoie l’image en JPEG base64 brut avec le bon Content-Type', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, true, 202))
    vi.stubGlobal('fetch', fetchMock)

    await uploadPlaylistCoverImage('token', 'pl1', 'base64data')

    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.spotify.com/v1/playlists/pl1/images')
    expect(init!.method).toBe('PUT')
    expect(init!.body).toBe('base64data')
    expect((init!.headers as Record<string, string>)['Content-Type']).toBe('image/jpeg')
  })
})
