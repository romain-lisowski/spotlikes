import { SPOTIFY_API_BASE_URL } from '@/config/spotify'
import { TokenExpiredError } from '@/utils/errors'
import { chunkArray } from '@/utils/chunk'
import { sleep } from '@/utils/sleep'
import type { LikedTrack, SpotifyUser } from '@/types/spotify'
import type {
  SpotifyPagingObject,
  SpotifySavedTrackItem,
  SpotifyUserProfile,
  SpotifyPlaylistObject,
} from '@/types/spotify-api'

const MAX_URIS_PER_REQUEST = 100
const MAX_RATE_LIMIT_RETRIES = 5

async function spotifyFetch(
  accessToken: string,
  url: string,
  init?: RequestInit,
  retriesLeft = MAX_RATE_LIMIT_RETRIES,
): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  })

  if (response.status === 401) {
    throw new TokenExpiredError()
  }

  if (response.status === 429 && retriesLeft > 0) {
    const retryAfterSeconds = Number(response.headers.get('Retry-After')) || 1
    await sleep(retryAfterSeconds * 1000)
    return spotifyFetch(accessToken, url, init, retriesLeft - 1)
  }

  if (!response.ok) {
    throw new Error(`Appel Spotify échoué : ${url} (${response.status})`)
  }

  return response
}

export async function getCurrentUser(accessToken: string): Promise<SpotifyUser> {
  const response = await spotifyFetch(accessToken, `${SPOTIFY_API_BASE_URL}/me`)
  const data: SpotifyUserProfile = await response.json()
  return { id: data.id, displayName: data.display_name ?? data.id }
}

export async function fetchAllLikedTracks(accessToken: string): Promise<LikedTrack[]> {
  const tracks: LikedTrack[] = []
  let nextUrl: string | null = `${SPOTIFY_API_BASE_URL}/me/tracks?limit=50`

  while (nextUrl) {
    const response = await spotifyFetch(accessToken, nextUrl)
    const page: SpotifyPagingObject<SpotifySavedTrackItem> = await response.json()

    for (const item of page.items) {
      const primaryArtist = item.track.artists[0]
      tracks.push({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists.map((artist) => artist.name).join(', '),
        artistId: primaryArtist?.id ?? '',
        primaryArtistName: primaryArtist?.name ?? '',
        uri: item.track.uri,
        addedAt: item.added_at,
        genres: [],
        previewUrl: item.track.preview_url,
      })
    }

    nextUrl = page.next
  }

  return tracks
}

export async function createPlaylist(
  accessToken: string,
  name: string,
): Promise<SpotifyPlaylistObject> {
  const response = await spotifyFetch(accessToken, `${SPOTIFY_API_BASE_URL}/me/playlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, public: false }),
  })
  return response.json()
}

export async function addTracksToPlaylist(
  accessToken: string,
  playlistId: string,
  uris: string[],
): Promise<void> {
  for (const batch of chunkArray(uris, MAX_URIS_PER_REQUEST)) {
    await spotifyFetch(accessToken, `${SPOTIFY_API_BASE_URL}/playlists/${playlistId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: batch }),
    })
  }
}

export async function uploadPlaylistCoverImage(
  accessToken: string,
  playlistId: string,
  base64Jpeg: string,
): Promise<void> {
  await spotifyFetch(accessToken, `${SPOTIFY_API_BASE_URL}/playlists/${playlistId}/images`, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: base64Jpeg,
  })
}
