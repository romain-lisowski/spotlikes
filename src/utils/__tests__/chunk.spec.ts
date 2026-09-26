import { describe, it, expect } from 'vitest'
import { chunkArray } from '../chunk'

describe('chunkArray', () => {
  it('retourne un tableau vide pour une liste vide', () => {
    expect(chunkArray([], 100)).toEqual([])
  })

  it('découpe en lots de taille exacte quand la liste est un multiple de la taille', () => {
    const items = Array.from({ length: 200 }, (_, i) => i)
    const chunks = chunkArray(items, 100)
    expect(chunks).toHaveLength(2)
    expect(chunks[0]).toHaveLength(100)
    expect(chunks[1]).toHaveLength(100)
  })

  it('met le reste dans un dernier lot plus petit', () => {
    const items = Array.from({ length: 250 }, (_, i) => i)
    const chunks = chunkArray(items, 100)
    expect(chunks.map((c) => c.length)).toEqual([100, 100, 50])
  })
})
