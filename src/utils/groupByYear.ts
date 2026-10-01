import type { LikedTrack, TrackGroup } from '@/types/spotify'

export const YEAR_KEY_PATTERN = /^\d{4}$/

export function yearKeyOf(addedAt: string): string {
  return String(new Date(addedAt).getUTCFullYear())
}

export function groupByYear(tracks: LikedTrack[]): TrackGroup[] {
  const tracksByYear = new Map<string, LikedTrack[]>()

  for (const track of tracks) {
    const yearKey = yearKeyOf(track.addedAt)
    const yearTracks = tracksByYear.get(yearKey)
    if (yearTracks) {
      yearTracks.push(track)
    } else {
      tracksByYear.set(yearKey, [track])
    }
  }

  return Array.from(tracksByYear.entries())
    .map(([key, yearTracks]) => ({
      key,
      label: key,
      tracks: yearTracks,
    }))
    .sort((a, b) => b.tracks.length - a.tracks.length || b.key.localeCompare(a.key))
}
