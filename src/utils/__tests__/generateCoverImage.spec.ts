import { describe, it, expect } from 'vitest'
import { wrapText, paletteFor } from '../generateCoverImage'

describe('wrapText', () => {
  it('garde tout sur une ligne si ça tient dans la largeur', () => {
    const lines = wrapText('Mellow Jazz', 500, (text) => text.length * 10)
    expect(lines).toEqual(['Mellow Jazz'])
  })

  it('coupe sur plusieurs lignes quand le texte dépasse la largeur', () => {
    const lines = wrapText('Golden Summer Mixtape 2026', 150, (text) => text.length * 10)
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.join(' ')).toBe('Golden Summer Mixtape 2026')
  })

  it('ne perd aucun mot lors du découpage', () => {
    const lines = wrapText('a b c d e f g', 25, (text) => text.length * 10)
    expect(lines.join(' ')).toBe('a b c d e f g')
  })
})

describe('paletteFor', () => {
  it('est déterministe pour un même seed et un même type', () => {
    expect(paletteFor('indie pop', 'genre')).toEqual(paletteFor('indie pop', 'genre'))
  })

  it('retourne toujours une paire de couleurs valide', () => {
    const [colorA, colorB] = paletteFor('classic rock', 'genre')
    expect(colorA).toMatch(/^#[0-9a-f]{6}$/i)
    expect(colorB).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('utilise des palettes différentes pour "genre" et "year"', () => {
    const genrePalettes = new Set(
      ['indie pop', 'rock', 'jazz'].map((s) => paletteFor(s, 'genre')[0]),
    )
    const yearPalettes = new Set(['2024', '2025', '2026'].map((s) => paletteFor(s, 'year')[0]))
    for (const color of yearPalettes) {
      expect(genrePalettes.has(color)).toBe(false)
    }
  })
})
