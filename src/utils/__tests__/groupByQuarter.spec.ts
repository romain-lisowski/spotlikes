import { describe, it, expect } from 'vitest'
import { groupByQuarter } from '../groupByQuarter'
import type { LikedTrack } from '@/types/spotify'

function track(id: string, addedAt: string): LikedTrack {
  return {
    id,
    name: `Track ${id}`,
    artist: 'Artist',
    artistId: 'artist-1',
    primaryArtistName: 'Artist',
    previewUrl: null,
    uri: `spotify:track:${id}`,
    addedAt,
    genres: [],
  }
}

describe('groupByQuarter', () => {
  it('retourne un tableau vide pour une liste vide', () => {
    expect(groupByQuarter([])).toEqual([])
  })

  it('regroupe les titres d’un même trimestre dans un seul groupe', () => {
    const tracks = [
      track('1', '2026-07-01T10:00:00Z'),
      track('2', '2026-08-15T10:00:00Z'),
      track('3', '2026-09-30T10:00:00Z'),
    ]

    const groups = groupByQuarter(tracks)

    expect(groups).toHaveLength(1)
    expect(groups[0]?.key).toBe('2026-Q3')
    expect(groups[0]?.label).toBe('T3 2026')
    expect(groups[0]?.tracks).toHaveLength(3)
  })

  it('répartit les titres à cheval sur plusieurs trimestres dans des groupes distincts', () => {
    const tracks = [
      track('1', '2026-09-05T10:00:00Z'),
      track('2', '2026-04-20T10:00:00Z'),
      track('3', '2026-09-10T10:00:00Z'),
    ]

    const groups = groupByQuarter(tracks)

    expect(groups.map((g) => g.key)).toEqual(['2026-Q3', '2026-Q2'])
    expect(groups.find((g) => g.key === '2026-Q3')?.tracks).toHaveLength(2)
    expect(groups.find((g) => g.key === '2026-Q2')?.tracks).toHaveLength(1)
  })

  it('trie les trimestres du plus grand nombre de titres au plus petit', () => {
    const tracks = [
      track('1', '2025-11-15T10:00:00Z'),
      track('2', '2025-11-20T10:00:00Z'),
      track('3', '2026-01-10T10:00:00Z'),
    ]

    const groups = groupByQuarter(tracks)

    expect(groups.map((g) => g.key)).toEqual(['2025-Q4', '2026-Q1'])
  })

  it('à nombre de titres égal, départage par trimestre le plus récent en premier', () => {
    const tracks = [track('1', '2025-11-15T10:00:00Z'), track('2', '2026-01-10T10:00:00Z')]

    const groups = groupByQuarter(tracks)

    expect(groups.map((g) => g.key)).toEqual(['2026-Q1', '2025-Q4'])
  })
})
