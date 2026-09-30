import { describe, it, expect } from 'vitest'
import { formatQuarterLabel, formatPlaylistName } from '../formatPlaylistName'
import { UNKNOWN_GENRE, MERGED_KEY_PREFIX } from '../groupByGenre'

describe('formatQuarterLabel', () => {
  it('formate un trimestre avec l’année', () => {
    expect(formatQuarterLabel('2026-Q3')).toBe('T3 2026')
  })

  it('formate correctement un autre trimestre', () => {
    expect(formatQuarterLabel('2026-Q1')).toBe('T1 2026')
  })
})

describe('formatPlaylistName', () => {
  it('reprend le libellé du trimestre tel quel', () => {
    expect(formatPlaylistName({ key: '2026-Q3' })).toBe('T3 2026')
    expect(formatPlaylistName({ key: '2022-Q1' })).toBe('T1 2022')
  })

  it('génère un nom "adjectif + genre" en anglais pour un groupe par genre', () => {
    const name = formatPlaylistName({ key: 'indie pop' })
    expect(name).toContain('Indie Pop')
    expect(name).not.toBe('Indie Pop')
  })

  it('génère un nom cohérent pour un groupe de genre fusionné', () => {
    expect(formatPlaylistName({ key: `${MERGED_KEY_PREFIX}pop` })).toContain('Pop')
  })

  it('utilise un nom dédié pour le groupe "Genre inconnu"', () => {
    expect(formatPlaylistName({ key: UNKNOWN_GENRE })).toBe('Mystery Mix')
  })

  it('est déterministe : le même groupe donne toujours le même nom', () => {
    const group = { key: 'indie pop' }
    expect(formatPlaylistName(group)).toBe(formatPlaylistName(group))
  })

  it('varie le nom selon le genre plutôt que d’utiliser toujours le même modèle', () => {
    const names = new Set([
      formatPlaylistName({ key: 'indie pop' }),
      formatPlaylistName({ key: 'classic rock' }),
      formatPlaylistName({ key: 'jazz' }),
      formatPlaylistName({ key: 'metal' }),
    ])
    expect(names.size).toBeGreaterThan(1)
  })
})
