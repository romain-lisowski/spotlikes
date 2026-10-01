import { describe, it, expect } from 'vitest'
import { groupByYear, yearKeyOf } from '../groupByYear'
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

describe('yearKeyOf', () => {
  it('retourne l’année en UTC', () => {
    expect(yearKeyOf('2026-07-01T10:00:00Z')).toBe('2026')
  })
})

describe('groupByYear', () => {
  it('retourne un tableau vide pour une liste vide', () => {
    expect(groupByYear([])).toEqual([])
  })

  it('regroupe les titres d’une même année dans un seul groupe', () => {
    const tracks = [
      track('1', '2026-01-01T10:00:00Z'),
      track('2', '2026-06-15T10:00:00Z'),
      track('3', '2026-12-30T10:00:00Z'),
    ]

    const groups = groupByYear(tracks)

    expect(groups).toHaveLength(1)
    expect(groups[0]?.key).toBe('2026')
    expect(groups[0]?.label).toBe('2026')
    expect(groups[0]?.tracks).toHaveLength(3)
  })

  it('répartit les titres à cheval sur plusieurs années dans des groupes distincts', () => {
    const tracks = [
      track('1', '2026-09-05T10:00:00Z'),
      track('2', '2022-04-20T10:00:00Z'),
      track('3', '2026-09-10T10:00:00Z'),
    ]

    const groups = groupByYear(tracks)

    expect(groups.map((g) => g.key)).toEqual(['2026', '2022'])
  })

  it('trie les années du plus grand nombre de titres au plus petit', () => {
    const tracks = [
      track('1', '2022-11-15T10:00:00Z'),
      track('2', '2022-11-20T10:00:00Z'),
      track('3', '2026-01-10T10:00:00Z'),
    ]

    const groups = groupByYear(tracks)

    expect(groups.map((g) => g.key)).toEqual(['2022', '2026'])
  })
})
