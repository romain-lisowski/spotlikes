import type { GroupingMode, LikedTrack, TrackGroup } from '@/types/spotify'
import { groupByQuarter } from './groupByQuarter'
import { groupByGenre } from './groupByGenre'
import { groupByQuarterAndGenre } from './groupByQuarterAndGenre'

export function groupTracks(tracks: LikedTrack[], mode: GroupingMode): TrackGroup[] {
  switch (mode) {
    case 'quarter':
      return groupByQuarter(tracks)
    case 'genre':
      return groupByGenre(tracks)
    case 'quarter-genre':
      return groupByQuarterAndGenre(tracks)
  }
}
