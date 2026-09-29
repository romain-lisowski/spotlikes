import { describe, it, expect, beforeEach } from 'vitest'
import { getCachedGenres, setCachedGenres } from '../genreCache'

beforeEach(() => {
  localStorage.clear()
})

describe('genreCache', () => {
  it('retourne undefined quand rien n’est en cache', () => {
    expect(getCachedGenres('Beach House')).toBeUndefined()
  })

  it('retourne les genres précédemment mis en cache', () => {
    setCachedGenres('Beach House', ['dream pop', 'indie pop'])
    expect(getCachedGenres('Beach House')).toEqual(['dream pop', 'indie pop'])
  })

  it('normalise la casse et les espaces du nom d’artiste', () => {
    setCachedGenres('Beach House', ['dream pop'])
    expect(getCachedGenres('  beach house  ')).toEqual(['dream pop'])
    expect(getCachedGenres('BEACH HOUSE')).toEqual(['dream pop'])
  })

  it('conserve les entrées existantes quand on en ajoute une nouvelle', () => {
    setCachedGenres('Beach House', ['dream pop'])
    setCachedGenres('Daft Punk', ['french house'])

    expect(getCachedGenres('Beach House')).toEqual(['dream pop'])
    expect(getCachedGenres('Daft Punk')).toEqual(['french house'])
  })
})
