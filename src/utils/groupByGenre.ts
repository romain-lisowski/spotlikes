import type { LikedTrack, TrackGroup } from '@/types/spotify'

export const UNKNOWN_GENRE = 'Genre inconnu'

// Fusionne les variantes d'écriture d'un même tag ("Hip-Hop", "HipHop", "hip hop")
// vers une seule forme canonique, utilisée à la fois comme clé de regroupement et
// comme base d'affichage.
export function normalizeGenreKey(genre: string): string {
  return genre
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function formatGenreLabel(genre: string): string {
  return genre.replace(/\b\w/g, (char) => char.toUpperCase())
}

export function primaryGenreOf(track: LikedTrack): string {
  return track.genres[0] ?? UNKNOWN_GENRE
}

function sortByGenre(a: TrackGroup, b: TrackGroup): number {
  if (a.key === UNKNOWN_GENRE) return 1
  if (b.key === UNKNOWN_GENRE) return -1
  return b.tracks.length - a.tracks.length || a.key.localeCompare(b.key)
}

export function groupByGenre(tracks: LikedTrack[]): TrackGroup[] {
  const tracksByGenre = new Map<string, LikedTrack[]>()

  for (const track of tracks) {
    const genre = primaryGenreOf(track)
    const genreTracks = tracksByGenre.get(genre)
    if (genreTracks) {
      genreTracks.push(track)
    } else {
      tracksByGenre.set(genre, [track])
    }
  }

  return Array.from(tracksByGenre.entries())
    .map(([key, genreTracks]) => ({
      key,
      label: key === UNKNOWN_GENRE ? key : formatGenreLabel(key),
      tracks: genreTracks,
    }))
    .sort(sortByGenre)
}
