import { describe, it, expect } from 'vitest'
import { groupByQuarterAndGenre } from '../groupByQuarterAndGenre'
import { UNKNOWN_GENRE } from '../groupByGenre'
import type { LikedTrack } from '@/types/spotify'

function track(id: string, addedAt: string, genres: string[]): LikedTrack {
  return {
    id,
    name: `Track ${id}`,
    artist: 'Artist',
    artistId: 'artist-1',
    primaryArtistName: 'Artist',
    previewUrl: null,
    uri: `spotify:track:${id}`,
    addedAt,
    genres,
  }
}

describe('groupByQuarterAndGenre', () => {
  it('retourne un tableau vide pour une liste vide', () => {
    expect(groupByQuarterAndGenre([])).toEqual([])
  })

  it('combine le tag exact et le trimestre dans la clé et le libellé', () => {
    const groups = groupByQuarterAndGenre([track('1', '2026-07-01T00:00:00Z', ['classic rock'])])

    expect(groups).toHaveLength(1)
    expect(groups[0]?.key).toBe('classic rock|2026-Q3')
    expect(groups[0]?.label).toBe('Classic Rock — T3 2026')
  })

  it('sépare le même tag sur des trimestres différents', () => {
    const groups = groupByQuarterAndGenre([
      track('1', '2026-07-01T00:00:00Z', ['classic rock']),
      track('2', '2026-07-05T00:00:00Z', ['classic rock']),
      track('3', '2026-04-01T00:00:00Z', ['classic rock']),
    ])

    expect(groups.map((g) => g.key)).toEqual(['classic rock|2026-Q3', 'classic rock|2026-Q2'])
    expect(groups.find((g) => g.key === 'classic rock|2026-Q3')?.tracks).toHaveLength(2)
  })

  it('ne place un titre que dans une seule catégorie, même avec plusieurs genres connus', () => {
    const groups = groupByQuarterAndGenre([
      track('1', '2026-07-01T00:00:00Z', ['indie pop', 'classic rock']),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0]?.key).toBe('indie pop|2026-Q3')
  })

  it('place les titres sans genre dans "Genre inconnu" pour leur trimestre', () => {
    const groups = groupByQuarterAndGenre([track('1', '2026-07-01T00:00:00Z', [])])

    expect(groups[0]?.key).toBe(`${UNKNOWN_GENRE}|2026-Q3`)
  })
})
