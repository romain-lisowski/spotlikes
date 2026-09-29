import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore } from '../player'
import type { LikedTrack } from '@/types/spotify'

class FakeAudio {
  src = ''
  listeners: Record<string, (() => void)[]> = {}
  play = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
  pause = vi.fn<() => void>()

  addEventListener(event: string, handler: () => void): void {
    this.listeners[event] = [...(this.listeners[event] ?? []), handler]
  }

  emit(event: string): void {
    for (const handler of this.listeners[event] ?? []) handler()
  }
}

let lastAudioInstance: FakeAudio

function track(id: string, previewUrl: string | null): LikedTrack {
  return {
    id,
    name: `Track ${id}`,
    artist: 'Artist',
    artistId: 'artist-1',
    primaryArtistName: 'Artist',
    uri: `spotify:track:${id}`,
    addedAt: '2026-09-01T00:00:00Z',
    genres: [],
    previewUrl,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.stubGlobal(
    'Audio',
    vi.fn(function AudioMock() {
      lastAudioInstance = new FakeAudio()
      return lastAudioInstance
    }),
  )
})

describe('usePlayerStore', () => {
  it('ne fait rien pour un titre sans preview disponible', () => {
    const store = usePlayerStore()
    store.toggle(track('1', null))
    expect(store.currentTrackId).toBeNull()
  })

  it('joue le titre et mémorise le titre en cours', async () => {
    const store = usePlayerStore()
    store.toggle(track('1', 'https://example.com/preview.mp3'))
    await Promise.resolve()

    expect(store.currentTrackId).toBe('1')
    expect(lastAudioInstance.play).toHaveBeenCalledOnce()
    expect(lastAudioInstance.src).toBe('https://example.com/preview.mp3')
  })

  it('arrête la lecture si on rebascule sur le même titre', async () => {
    const store = usePlayerStore()
    const t = track('1', 'https://example.com/preview.mp3')
    store.toggle(t)
    await Promise.resolve()
    store.toggle(t)

    expect(store.currentTrackId).toBeNull()
    expect(lastAudioInstance.pause).toHaveBeenCalledOnce()
  })

  it('bascule vers un autre titre sans avoir besoin de le stopper explicitement', async () => {
    const store = usePlayerStore()
    store.toggle(track('1', 'https://example.com/a.mp3'))
    await Promise.resolve()
    store.toggle(track('2', 'https://example.com/b.mp3'))
    await Promise.resolve()

    expect(store.currentTrackId).toBe('2')
    expect(lastAudioInstance.src).toBe('https://example.com/b.mp3')
  })

  it('réinitialise le titre en cours quand la lecture se termine', async () => {
    const store = usePlayerStore()
    store.toggle(track('1', 'https://example.com/preview.mp3'))
    await Promise.resolve()

    lastAudioInstance.emit('ended')

    expect(store.currentTrackId).toBeNull()
  })
})
