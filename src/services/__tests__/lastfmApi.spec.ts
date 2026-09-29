import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchArtistsGenres } from '../lastfmApi'

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response
}

function toptagsResponse(tagNames: string[]) {
  return jsonResponse({ toptags: { tag: tagNames.map((name) => ({ name })) } })
}

beforeEach(() => {
  localStorage.clear()
})

describe('fetchArtistsGenres', () => {
  it('retourne une map artistId -> genres en interrogeant chaque artiste par son nom', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(toptagsResponse(['indie pop', 'dream pop']))
      .mockResolvedValueOnce(toptagsResponse([]))
    vi.stubGlobal('fetch', fetchMock)

    const genresByArtistId = await fetchArtistsGenres([
      { id: 'artist-1', name: 'Beach House' },
      { id: 'artist-2', name: 'Unknown Band' },
    ])

    expect(genresByArtistId.get('artist-1')).toEqual(['indie pop'])
    expect(genresByArtistId.get('artist-2')).toEqual([])

    const [firstUrl] = fetchMock.mock.calls[0]!
    expect(String(firstUrl)).toContain('artist=Beach+House')
    expect(String(firstUrl)).toContain('method=artist.gettoptags')
  })

  it('ne garde que le tag le plus représentatif par artiste (un seul genre par like)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(toptagsResponse(['a', 'b', 'c', 'd', 'e', 'f', 'g'])),
    )

    const genresByArtistId = await fetchArtistsGenres([{ id: 'artist-1', name: 'Artist' }])

    expect(genresByArtistId.get('artist-1')).toEqual(['a'])
  })

  it('normalise les tags (casse, tirets, camelCase) avant de les stocker', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(toptagsResponse(['Hip-Hop'])))

    const genresByArtistId = await fetchArtistsGenres([{ id: 'artist-1', name: 'Artist' }])

    expect(genresByArtistId.get('artist-1')).toEqual(['hip hop'])
  })

  it('retourne une liste vide (sans lever d’erreur) quand Last.fm ne trouve pas l’artiste', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          jsonResponse({ error: 6, message: 'The artist you supplied could not be found' }),
        ),
    )

    const genresByArtistId = await fetchArtistsGenres([{ id: 'artist-1', name: 'Xyzzy' }])

    expect(genresByArtistId.get('artist-1')).toEqual([])
  })

  it('lève une erreur en cas d’échec réseau/HTTP', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, false, 500)))

    await expect(fetchArtistsGenres([{ id: 'artist-1', name: 'Artist' }])).rejects.toThrow(
      'Appel Last.fm échoué',
    )
  })

  it('ne fait aucun appel si la liste d’artistes est vide', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)

    const genresByArtistId = await fetchArtistsGenres([])

    expect(fetchMock).not.toHaveBeenCalled()
    expect(genresByArtistId.size).toBe(0)
  })

  it('réutilise le cache local et ne refait pas d’appel réseau pour un artiste déjà interrogé', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(toptagsResponse(['indie pop']))
    vi.stubGlobal('fetch', fetchMock)

    await fetchArtistsGenres([{ id: 'artist-1', name: 'Beach House' }])
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const genresByArtistId = await fetchArtistsGenres([{ id: 'artist-1', name: 'Beach House' }])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(genresByArtistId.get('artist-1')).toEqual(['indie pop'])
  })
})
