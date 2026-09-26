import type { LikedTrack, MonthGroup } from '@/types/spotify'
import { formatMonthLabel } from './formatPlaylistName'

function monthKeyOf(addedAt: string): string {
  const date = new Date(addedAt)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

export function groupByMonth(tracks: LikedTrack[]): MonthGroup[] {
  const tracksByMonth = new Map<string, LikedTrack[]>()

  for (const track of tracks) {
    const monthKey = monthKeyOf(track.addedAt)
    const monthTracks = tracksByMonth.get(monthKey)
    if (monthTracks) {
      monthTracks.push(track)
    } else {
      tracksByMonth.set(monthKey, [track])
    }
  }

  return Array.from(tracksByMonth.entries())
    .map(([monthKey, monthTracks]) => ({
      monthKey,
      label: formatMonthLabel(monthKey),
      tracks: monthTracks,
    }))
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
}
