import { describe, it, expect } from 'vitest'
import { formatMonthLabel, formatPlaylistName } from '../formatPlaylistName'

describe('formatMonthLabel', () => {
  it('formate un mois en français avec l’année', () => {
    expect(formatMonthLabel('2026-09')).toBe('septembre 2026')
  })

  it('formate correctement un autre mois', () => {
    expect(formatMonthLabel('2026-01')).toBe('janvier 2026')
  })
})

describe('formatPlaylistName', () => {
  it('préfixe le libellé du mois avec "Likes —"', () => {
    expect(formatPlaylistName('2026-09')).toBe('Likes — septembre 2026')
  })
})
