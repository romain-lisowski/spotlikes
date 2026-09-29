import type { LikedTrack, TrackGroup } from '@/types/spotify'
import { UNKNOWN_GENRE, primaryGenreOf, formatGenreLabel } from './groupByGenre'
import { quarterKeyOf } from './groupByQuarter'
import { formatQuarterLabel } from './formatPlaylistName'

function sortByTrackCount(a: TrackGroup, b: TrackGroup): number {
  const genreA = a.key.split('|')[0]
  const genreB = b.key.split('|')[0]

  if (genreA === UNKNOWN_GENRE && genreB !== UNKNOWN_GENRE) return 1
  if (genreB === UNKNOWN_GENRE && genreA !== UNKNOWN_GENRE) return -1
  return b.tracks.length - a.tracks.length || a.key.localeCompare(b.key)
}

export function groupByQuarterAndGenre(tracks: LikedTrack[]): TrackGroup[] {
  const tracksByKey = new Map<string, LikedTrack[]>()

  for (const track of tracks) {
    const quarterKey = quarterKeyOf(track.addedAt)
    const genre = primaryGenreOf(track)
    const key = `${genre}|${quarterKey}`
    const keyTracks = tracksByKey.get(key)
    if (keyTracks) {
      keyTracks.push(track)
    } else {
      tracksByKey.set(key, [track])
    }
  }

  return Array.from(tracksByKey.entries())
    .map(([key, keyTracks]) => {
      const [genre, quarterKey] = key.split('|')
      const genreLabel = genre === UNKNOWN_GENRE ? UNKNOWN_GENRE : formatGenreLabel(genre!)
      return {
        key,
        label: `${genreLabel} — ${formatQuarterLabel(quarterKey!)}`,
        tracks: keyTracks,
      }
    })
    .sort(sortByTrackCount)
}
