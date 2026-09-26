export interface LikedTrack {
  id: string
  name: string
  artist: string
  uri: string
  addedAt: string
}

export interface MonthGroup {
  monthKey: string
  label: string
  tracks: LikedTrack[]
}

export interface SpotifyUser {
  id: string
  displayName: string
}

export interface PlaylistCreationResult {
  monthKey: string
  playlistName: string
  playlistUrl: string | null
  success: boolean
  errorMessage?: string
}
