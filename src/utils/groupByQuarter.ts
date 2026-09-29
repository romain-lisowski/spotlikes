import type { LikedTrack, TrackGroup } from '@/types/spotify'
import { formatQuarterLabel } from './formatPlaylistName'

export function quarterKeyOf(addedAt: string): string {
  const date = new Date(addedAt)
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1
  return `${date.getUTCFullYear()}-Q${quarter}`
}

export function groupByQuarter(tracks: LikedTrack[]): TrackGroup[] {
  const tracksByQuarter = new Map<string, LikedTrack[]>()

  for (const track of tracks) {
    const quarterKey = quarterKeyOf(track.addedAt)
    const quarterTracks = tracksByQuarter.get(quarterKey)
    if (quarterTracks) {
      quarterTracks.push(track)
    } else {
      tracksByQuarter.set(quarterKey, [track])
    }
  }

  return Array.from(tracksByQuarter.entries())
    .map(([key, quarterTracks]) => ({
      key,
      label: formatQuarterLabel(key),
      tracks: quarterTracks,
    }))
    .sort((a, b) => b.tracks.length - a.tracks.length || b.key.localeCompare(a.key))
}
