import { LASTFM_API_BASE_URL, LASTFM_API_KEY } from '@/config/lastfm'
import { sleep } from '@/utils/sleep'
import { normalizeGenreKey } from '@/utils/groupByGenre'
import { getCachedGenres, setCachedGenres } from './genreCache'
import type { LastfmTopTagsResponse } from '@/types/lastfm-api'

const MAX_TAGS_PER_ARTIST = 1
const DELAY_BETWEEN_ARTIST_REQUESTS_MS = 200

async function fetchArtistGenres(artistName: string): Promise<string[]> {
  const params = new URLSearchParams({
    method: 'artist.gettoptags',
    artist: artistName,
    api_key: LASTFM_API_KEY,
    format: 'json',
  })

  const response = await fetch(`${LASTFM_API_BASE_URL}?${params.toString()}`)
  if (!response.ok) {
    throw new Error(`Appel Last.fm échoué : ${artistName} (${response.status})`)
  }

  const data: LastfmTopTagsResponse = await response.json()
  if (data.error) {
    return []
  }

  return (data.toptags?.tag ?? [])
    .slice(0, MAX_TAGS_PER_ARTIST)
    .map((tag) => normalizeGenreKey(tag.name))
}

export async function fetchArtistsGenres(
  artists: { id: string; name: string }[],
): Promise<Map<string, string[]>> {
  const genresByArtistId = new Map<string, string[]>()
  let isFirstNetworkCall = true

  for (const artist of artists) {
    const cached = getCachedGenres(artist.name)
    if (cached) {
      genresByArtistId.set(artist.id, cached)
      continue
    }

    if (!isFirstNetworkCall) {
      await sleep(DELAY_BETWEEN_ARTIST_REQUESTS_MS)
    }
    isFirstNetworkCall = false

    const genres = await fetchArtistGenres(artist.name)
    setCachedGenres(artist.name, genres)
    genresByArtistId.set(artist.id, genres)
  }

  return genresByArtistId
}
