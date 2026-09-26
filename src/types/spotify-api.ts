export interface SpotifyPagingObject<T> {
  items: T[]
  next: string | null
}

export interface SpotifySavedTrackItem {
  added_at: string
  track: {
    id: string
    name: string
    uri: string
    artists: { name: string }[]
  }
}

export interface SpotifyUserProfile {
  id: string
  display_name: string | null
}

export interface SpotifyPlaylistObject {
  id: string
  external_urls: { spotify: string }
}
