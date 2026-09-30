import { describe, it, expect } from 'vitest'
import {
  groupByGenre,
  formatGenreLabel,
  normalizeGenreKey,
  primaryGenreOf,
  lastWordOf,
  genreKeyOf,
  isNationalityGenre,
  MERGED_KEY_PREFIX,
  SMALL_GROUP_TRACK_THRESHOLD,
  UNKNOWN_GENRE,
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

describe('formatGenreLabel', () => {
  it('met une majuscule à chaque mot du tag', () => {
    expect(formatGenreLabel('indie pop')).toBe('Indie Pop')
  })
})

describe('normalizeGenreKey', () => {
  it('fusionne les variantes d’écriture d’un même tag', () => {
    expect(normalizeGenreKey('Hip-Hop')).toBe('hip hop')
    expect(normalizeGenreKey('HipHop')).toBe('hip hop')
    expect(normalizeGenreKey('hip hop')).toBe('hip hop')
    expect(normalizeGenreKey('  Hip_Hop  ')).toBe('hip hop')
  })
})

describe('primaryGenreOf', () => {
  it('retourne le premier genre du titre', () => {
    expect(primaryGenreOf(track('1', ['indie pop', 'dream pop']))).toBe('indie pop')
  })

  it('retourne "Genre inconnu" quand le titre n’a aucun genre', () => {
    expect(primaryGenreOf(track('1', []))).toBe(UNKNOWN_GENRE)
  })
})

describe('lastWordOf', () => {
  it('retourne le dernier mot du tag', () => {
    expect(lastWordOf('indie pop')).toBe('pop')
    expect(lastWordOf('classic rock')).toBe('rock')
  })

  it('retourne le mot lui-même pour un tag d’un seul mot', () => {
    expect(lastWordOf('pop')).toBe('pop')
  })
})

describe('isNationalityGenre', () => {
  it('reconnaît les tags de nationalité', () => {
    expect(isNationalityGenre('french pop')).toBe(true)
    expect(isNationalityGenre('italian')).toBe(true)
    expect(isNationalityGenre('german techno')).toBe(true)
  })

  it('ne matche pas un genre établi qui contient un fragment ambigu', () => {
    expect(isNationalityGenre('uk garage')).toBe(false)
    expect(isNationalityGenre('k pop')).toBe(false)
  })

  it('ne reconnaît pas un genre sans lien avec une nationalité', () => {
    expect(isNationalityGenre('indie pop')).toBe(false)
  })
})

describe('genreKeyOf', () => {
  it('retourne le genre tel quel pour une clé simple', () => {
    expect(genreKeyOf('indie pop')).toBe('indie pop')
  })

  it('retire le préfixe de fusion', () => {
    expect(genreKeyOf(`${MERGED_KEY_PREFIX}pop`)).toBe('pop')
  })
})

describe('groupByGenre', () => {
  it('retourne un tableau vide pour une liste vide', () => {
    expect(groupByGenre([])).toEqual([])
  })

  it('classe un titre sous son genre principal', () => {
    const groups = groupByGenre([track('1', ['classic rock'])])
    expect(groups).toHaveLength(1)
    expect(groups[0]?.key).toBe('classic rock')
    expect(groups[0]?.label).toBe('Classic Rock')
  })

  it('place chaque titre dans une seule catégorie, même si plusieurs genres sont connus', () => {
    const groups = groupByGenre([track('1', ['indie pop', 'classic rock'])])

    expect(groups).toHaveLength(1)
    expect(groups[0]?.key).toBe('indie pop')
  })

  it('regroupe les artistes sans genre à part', () => {
    const groups = groupByGenre([track('1', [])])
    expect(groups).toHaveLength(1)
    expect(groups[0]?.key).toBe(UNKNOWN_GENRE)
  })

  it('place le groupe "Genre inconnu" en dernier', () => {
    const groups = groupByGenre([track('1', []), track('2', ['classic rock'])])
    expect(groups[groups.length - 1]?.key).toBe(UNKNOWN_GENRE)
  })
})

describe('groupByGenre — fusion des petits groupes', () => {
  it('fusionne les petits groupes qui partagent le dernier mot de leur tag', () => {
    const tracks = [
      ...manyTracks(3, 'indie pop'),
      ...manyTracks(2, 'dream pop'),
      ...manyTracks(1, 'chamber pop'),
    ]

    const groups = groupByGenre(tracks)

    expect(groups).toHaveLength(1)
    expect(groups[0]?.key).toBe(`${MERGED_KEY_PREFIX}pop`)
    expect(groups[0]?.tracks).toHaveLength(6)
  })

  it('ne fusionne pas un petit groupe isolé (aucun autre tag ne partage son dernier mot)', () => {
    const groups = groupByGenre(manyTracks(2, 'bossa nova'))

    expect(groups).toHaveLength(1)
    expect(groups[0]?.key).toBe('bossa nova')
  })

  it('ne fusionne pas les groupes qui atteignent déjà le seuil', () => {
    const tracks = [
      ...manyTracks(SMALL_GROUP_TRACK_THRESHOLD, 'indie pop'),
      ...manyTracks(2, 'dream pop'),
    ]

    const groups = groupByGenre(tracks)

    expect(groups.map((g) => g.key).sort()).toEqual(['dream pop', 'indie pop'])
  })

  it('ne fusionne jamais le groupe "Genre inconnu", même petit', () => {
    const groups = groupByGenre([track('1', []), track('2', [])])

    expect(groups).toHaveLength(1)
    expect(groups[0]?.key).toBe(UNKNOWN_GENRE)
  })
})
