export interface LikedTrack {
  id: string
  name: string
  artist: string
  artistId: string
  primaryArtistName: string
  uri: string
  addedAt: string
  genres: string[]
  previewUrl: string | null
}

export type GroupingMode = 'quarter' | 'genre'

export interface TrackGroup {
  key: string
  label: string
  tracks: LikedTrack[]
}

export interface SpotifyUser {
  id: string
  displayName: string
}

export interface PlaylistCreationResult {
  groupKey: string
  playlistName: string
  playlistUrl: string | null
  success: boolean
  errorMessage?: string
}
