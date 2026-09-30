import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import TrackList from '../TrackList.vue'
import { usePlaylistsStore } from '@/stores/playlists'
import { usePlayerStore } from '@/stores/player'
import type { LikedTrack } from '@/types/spotify'

class FakeAudio {
  src = ''
  play = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
  pause = vi.fn<() => void>()
  addEventListener = vi.fn<() => void>()
}

function track(id: string, previewUrl: string | null, genres: string[] = []): LikedTrack {
  return {
    id,
    name: `Track ${id}`,
    artist: 'Artist',
    artistId: 'artist-1',
    primaryArtistName: 'Artist',
    previewUrl,
    uri: `spotify:track:${id}`,
    addedAt: '2026-09-01T00:00:00Z',
    genres,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.stubGlobal(
    'Audio',
    vi.fn(function AudioMock() {
      return new FakeAudio()
    }),
  )
})

describe('TrackList', () => {
  it('affiche le titre et l’artiste', () => {
    const wrapper = mount(TrackList, {
      props: { tracks: [track('1', null)], groupKey: '2026-Q3' },
    })
    expect(wrapper.text()).toContain('Artist — Track 1')
  })

  it('affiche les genres du titre quand ils sont connus', () => {
    const wrapper = mount(TrackList, {
      props: { tracks: [track('1', null, ['indie pop'])], groupKey: '2026-Q3' },
    })
    expect(wrapper.text()).toContain('indie pop')
  })

  it('décoche la case exclut le titre côté store, et la recocher l’inclut à nouveau', async () => {
    const wrapper = mount(TrackList, {
      props: { tracks: [track('1', null)], groupKey: '2026-Q3' },
    })
    const store = usePlaylistsStore()

    expect(store.isTrackExcluded('2026-Q3', '1')).toBe(false)

    await wrapper.find('input[type="checkbox"]').setValue(false)
    expect(store.isTrackExcluded('2026-Q3', '1')).toBe(true)

    await wrapper.find('input[type="checkbox"]').setValue(true)
    expect(store.isTrackExcluded('2026-Q3', '1')).toBe(false)
  })

  it('désactive le bouton de lecture quand aucun aperçu n’est disponible', () => {
    const wrapper = mount(TrackList, {
      props: { tracks: [track('1', null)], groupKey: '2026-Q3' },
    })
    expect(wrapper.find('.play-button').attributes('disabled')).toBeDefined()
  })

  it('le bouton de lecture déclenche le player store quand un aperçu est disponible', async () => {
    const wrapper = mount(TrackList, {
      props: { tracks: [track('1', 'https://example.com/preview.mp3')], groupKey: '2026-Q3' },
    })
    const playerStore = usePlayerStore()

    expect(wrapper.find('.play-button').attributes('disabled')).toBeUndefined()

    await wrapper.find('.play-button').trigger('click')

    expect(playerStore.currentTrackId).toBe('1')
  })
})
