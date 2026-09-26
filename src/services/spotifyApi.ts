import { SPOTIFY_API_BASE_URL } from '@/config/spotify'
import { TokenExpiredError } from '@/utils/errors'
import { chunkArray } from '@/utils/chunk'
import type { LikedTrack, SpotifyUser } from '@/types/spotify'
import type {
  SpotifyPagingObject,
  SpotifySavedTrackItem,
  SpotifyUserProfile,
  SpotifyPlaylistObject,
} from '@/types/spotify-api'

const MAX_URIS_PER_REQUEST = 100

async function spotifyFetch(
  accessToken: string,
  url: string,
  init?: RequestInit,
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
      tracks.push({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists.map((artist) => artist.name).join(', '),
        uri: item.track.uri,
        addedAt: item.added_at,
      })
    }

    nextUrl = page.next
  }

  return tracks
}

export async function createPlaylist(
  accessToken: string,
  userId: string,
  name: string,
): Promise<SpotifyPlaylistObject> {
  const response = await spotifyFetch(
    accessToken,
    `${SPOTIFY_API_BASE_URL}/users/${userId}/playlists`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, public: false }),
    },
  )
  return response.json()
}

export async function addTracksToPlaylist(
  accessToken: string,
  playlistId: string,
  uris: string[],
): Promise<void> {
  for (const batch of chunkArray(uris, MAX_URIS_PER_REQUEST)) {
    await spotifyFetch(accessToken, `${SPOTIFY_API_BASE_URL}/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: batch }),
    })
  }
}
