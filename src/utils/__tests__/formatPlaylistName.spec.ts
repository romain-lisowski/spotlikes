import { describe, it, expect } from 'vitest'
import { formatPlaylistName } from '../formatPlaylistName'
import { UNKNOWN_GENRE } from '../groupByGenre'

describe('formatPlaylistName', () => {
  it('reprend l’année telle quelle', () => {
    expect(formatPlaylistName({ key: '2026' })).toBe('2026')
    expect(formatPlaylistName({ key: '2022' })).toBe('2022')
  })

  it('génère un nom thématique en anglais pour une famille de genre', () => {
    expect(formatPlaylistName({ key: 'Rock' })).toBe('Amplified Rock')
    expect(formatPlaylistName({ key: 'Blues' })).toBe('Gritty Blues')
    expect(formatPlaylistName({ key: 'Hip-Hop' })).toBe('Rhythmic Hip-Hop')
  })

  it('utilise un nom dédié pour le groupe "Genre inconnu"', () => {
    expect(formatPlaylistName({ key: UNKNOWN_GENRE })).toBe('Mystery Mix')
  })

  it('utilise un mot par défaut pour la famille "Autres"', () => {
    expect(formatPlaylistName({ key: 'Autres' })).toBe('Mixed Autres')
  })

  it('est déterministe : la même famille donne toujours le même nom', () => {
    expect(formatPlaylistName({ key: 'Rock' })).toBe(formatPlaylistName({ key: 'Rock' }))
  })

  it('ne répète pas le même mot pour des familles différentes', () => {
    const names = ['Rock', 'Jazz', 'Metal', 'Electro'].map((key) => formatPlaylistName({ key }))
    const firstWords = names.map((name) => name.split(' ')[0])
    expect(new Set(firstWords).size).toBe(firstWords.length)
  })
})
