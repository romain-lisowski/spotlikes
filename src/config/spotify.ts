export const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID

export const SPOTIFY_REDIRECT_URI = `${window.location.origin}/callback`

export const SPOTIFY_SCOPES = ['user-library-read', 'playlist-modify-private']

export const SPOTIFY_AUTHORIZE_URL = 'https://accounts.spotify.com/authorize'
export const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
export const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1'
