import { describe, it, expect } from 'vitest'
import {
  groupByGenre,
  formatGenreLabel,
  normalizeGenreKey,
  primaryGenreOf,
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
