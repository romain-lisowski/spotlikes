// v2 : les tags sont désormais normalisés avant mise en cache (fusion des variantes
// d'écriture comme "Hip-Hop"/"HipHop") et un seul tag est conservé par artiste.
// Le changement de clé invalide l'ancien cache non normalisé.
const STORAGE_KEY = 'spotlikes:genre-cache:v2'

function normalizeArtistName(name: string): string {
  return name.trim().toLowerCase()
}

function readCache(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeCache(cache: Record<string, string[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // Stockage plein ou indisponible : le cache est best-effort, on ignore.
  }
}

export function getCachedGenres(artistName: string): string[] | undefined {
  return readCache()[normalizeArtistName(artistName)]
}

export function setCachedGenres(artistName: string, genres: string[]): void {
  const cache = readCache()
  cache[normalizeArtistName(artistName)] = genres
  writeCache(cache)
}
