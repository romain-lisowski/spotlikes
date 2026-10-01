import { describe, it, expect } from 'vitest'
import {
  groupByGenre,
  normalizeGenreKey,
  mapGenreToFamily,
  primaryGenreOf,
  UNKNOWN_GENRE,
  FALLBACK_FAMILY,
} from '../groupByGenre'
import type { LikedTrack } from '@/types/spotify'

function track(id: string, genres: string[]): LikedTrack {
  return {
    id,
    name: `Track ${id}`,
    artist: 'Artist',
    artistId: 'artist-1',
    primaryArtistName: 'Artist',
    previewUrl: null,
    uri: `spotify:track:${id}`,
    addedAt: '2026-09-01T00:00:00Z',
    genres,
  }
}

function manyTracks(count: number, genre: string): LikedTrack[] {
  return Array.from({ length: count }, (_, index) => track(`${genre}-${index}`, [genre]))
}

describe('normalizeGenreKey', () => {
  it('fusionne les variantes d’écriture d’un même tag', () => {
    expect(normalizeGenreKey('Hip-Hop')).toBe('hip hop')
    expect(normalizeGenreKey('HipHop')).toBe('hip hop')
    expect(normalizeGenreKey('hip hop')).toBe('hip hop')
    expect(normalizeGenreKey('  Hip_Hop  ')).toBe('hip hop')
  })
})

describe('mapGenreToFamily', () => {
  it('classe un tag brut dans sa grande famille', () => {
    expect(mapGenreToFamily('conscious hip hop')).toBe('Hip-Hop')
    expect(mapGenreToFamily('death metal')).toBe('Metal')
    expect(mapGenreToFamily('deep house')).toBe('Electro')
    expect(mapGenreToFamily('classic rock')).toBe('Rock')
    expect(mapGenreToFamily('funk')).toBe('Soul')
    expect(mapGenreToFamily('delta blues')).toBe('Blues')
    expect(mapGenreToFamily('smooth jazz')).toBe('Jazz')
    expect(mapGenreToFamily('hardcore punk')).toBe('Punk')
    expect(mapGenreToFamily('disco')).toBe('Disco')
    expect(mapGenreToFamily('chillwave')).toBe('Chill')
    expect(mapGenreToFamily('k-pop')).toBe('Pop')
    expect(mapGenreToFamily('afrobeat')).toBe('World')
    expect(mapGenreToFamily('traditional folk')).toBe('Rock')
  })

  it('sépare l’indie pop (rock) de l’indie electronic', () => {
    expect(mapGenreToFamily('indie pop')).toBe('Rock')
    expect(mapGenreToFamily('indie rock')).toBe('Rock')
    expect(mapGenreToFamily('indie electronic')).toBe('Electro')
    expect(mapGenreToFamily('indie dance')).toBe('Electro')
  })

  it('retombe sur la famille "Autres" pour un tag sans correspondance', () => {
    expect(mapGenreToFamily('bossa nova')).toBe(FALLBACK_FAMILY)
  })
})

describe('primaryGenreOf', () => {
  it('classe le titre selon son premier tag de genre', () => {
    expect(primaryGenreOf(track('1', ['indie pop', 'dream pop']))).toBe('Rock')
  })

  it('retourne "Genre inconnu" quand le titre n’a aucun genre', () => {
    expect(primaryGenreOf(track('1', []))).toBe(UNKNOWN_GENRE)
  })
})

describe('groupByGenre', () => {
  it('retourne un tableau vide pour une liste vide', () => {
    expect(groupByGenre([])).toEqual([])
  })

  it('classe un titre sous la famille de son genre principal', () => {
    const groups = groupByGenre(manyTracks(21, 'classic rock'))
    expect(groups).toHaveLength(1)
    expect(groups[0]?.key).toBe('Rock')
    expect(groups[0]?.label).toBe('Rock')
  })

  it('place chaque titre dans une seule famille, même si plusieurs genres sont connus', () => {
    const groups = groupByGenre([
      track('1', ['indie pop', 'classic rock']),
      ...manyTracks(20, 'classic rock'),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0]?.key).toBe('Rock')
  })

  it('regroupe des tags différents partageant la même famille', () => {
    const groups = groupByGenre([
      ...manyTracks(20, 'techno'),
      track('a', ['deep house']),
      track('b', ['uk garage']),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0]?.key).toBe('Electro')
    expect(groups[0]?.tracks).toHaveLength(22)
  })

  it('regroupe les artistes sans genre à part', () => {
    const groups = groupByGenre([track('1', [])])
    expect(groups).toHaveLength(1)
    expect(groups[0]?.key).toBe(UNKNOWN_GENRE)
  })

  it('place le groupe "Genre inconnu" en dernier', () => {
    const groups = groupByGenre([track('1', []), ...manyTracks(21, 'classic rock')])
    expect(groups[groups.length - 1]?.key).toBe(UNKNOWN_GENRE)
  })
})

describe('groupByGenre — fusion des petites familles', () => {
  it('fusionne Punk dans Rock quand Punk a moins de 20 titres', () => {
    const groups = groupByGenre([...manyTracks(21, 'classic rock'), ...manyTracks(5, 'punk')])

    expect(groups.map((g) => g.key)).not.toContain('Punk')
    const rock = groups.find((g) => g.key === 'Rock')
    expect(rock?.tracks).toHaveLength(26)
  })

  it('garde Punk séparé quand il dépasse le seuil', () => {
    const groups = groupByGenre([...manyTracks(21, 'classic rock'), ...manyTracks(21, 'punk')])

    expect(groups.map((g) => g.key)).toContain('Punk')
  })

  it('fusionne une petite famille sans cible dédiée dans "Autres"', () => {
    const groups = groupByGenre([...manyTracks(21, 'classic rock'), ...manyTracks(3, 'delta blues')])

    expect(groups.map((g) => g.key)).not.toContain('Blues')
    const autres = groups.find((g) => g.key === FALLBACK_FAMILY)
    expect(autres?.tracks).toHaveLength(3)
  })

  it('ne fusionne jamais le groupe "Genre inconnu", même petit', () => {
    const groups = groupByGenre([track('1', []), track('2', [])])

    expect(groups).toHaveLength(1)
    expect(groups[0]?.key).toBe(UNKNOWN_GENRE)
  })
})
