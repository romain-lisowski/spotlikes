import { describe, it, expect } from 'vitest'
import { groupByMonth } from '../groupByMonth'
import type { LikedTrack } from '@/types/spotify'

function track(id: string, addedAt: string): LikedTrack {
  return { id, name: `Track ${id}`, artist: 'Artist', uri: `spotify:track:${id}`, addedAt }
}

describe('groupByMonth', () => {
  it('retourne un tableau vide pour une liste vide', () => {
    expect(groupByMonth([])).toEqual([])
  })

  it('regroupe les titres d’un même mois dans un seul groupe', () => {
    const tracks = [
      track('1', '2026-09-01T10:00:00Z'),
      track('2', '2026-09-15T10:00:00Z'),
      track('3', '2026-09-30T10:00:00Z'),
    ]

    const groups = groupByMonth(tracks)

    expect(groups).toHaveLength(1)
    expect(groups[0]?.monthKey).toBe('2026-09')
    expect(groups[0]?.label).toBe('septembre 2026')
    expect(groups[0]?.tracks).toHaveLength(3)
  })

  it('répartit les titres à cheval sur plusieurs mois dans des groupes distincts', () => {
    const tracks = [
      track('1', '2026-09-05T10:00:00Z'),
      track('2', '2026-08-20T10:00:00Z'),
      track('3', '2026-09-10T10:00:00Z'),
    ]

    const groups = groupByMonth(tracks)

    expect(groups.map((g) => g.monthKey)).toEqual(['2026-09', '2026-08'])
    expect(groups.find((g) => g.monthKey === '2026-09')?.tracks).toHaveLength(2)
    expect(groups.find((g) => g.monthKey === '2026-08')?.tracks).toHaveLength(1)
  })

  it('trie les mois du plus récent au plus ancien, y compris à cheval sur deux années', () => {
    const tracks = [
      track('1', '2025-12-15T10:00:00Z'),
      track('2', '2026-02-01T10:00:00Z'),
      track('3', '2026-01-10T10:00:00Z'),
    ]

    const groups = groupByMonth(tracks)

    expect(groups.map((g) => g.monthKey)).toEqual(['2026-02', '2026-01', '2025-12'])
  })
})
